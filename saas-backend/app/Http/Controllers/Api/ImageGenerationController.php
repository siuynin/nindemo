<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use App\Services\RunwareService;
use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ImageGenerationController extends Controller
{
    protected $runwareService;
    protected $imageStorageService;

    public function __construct(RunwareService $runwareService, ImageStorageService $imageStorageService)
    {
        $this->runwareService = $runwareService;
        $this->imageStorageService = $imageStorageService;
    }

    /**
     * Create image using complete backend flow
     */
    public function createImage(Request $request)
    {
        try {
            // Validate request
            $validatedData = $request->validate([
                'prompt' => 'required|string|max:1000',
                'model' => 'required|string',
                'width' => 'required|integer|min:512|max:1600',
                'height' => 'required|integer|min:512|max:1600',
                'numberResults' => 'required|integer|min:1|max:4',
                'imageStyle' => 'nullable|string',
                'name' => 'nullable|string|max:255',
                'share' => 'nullable|boolean'
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get model pricing
            $model = \App\Models\AIModel::where('slug', $validatedData['model'])->first();
            if (!$model) {
                return response()->json(['error' => 'Model not found'], 404);
            }

            // Calculate credit cost (model price * number of images)
            $creditCost = $model->credit_price * $validatedData['numberResults'];

            Log::info('Credit cost calculation', [
                'model_slug' => $validatedData['model'],
                'model_price' => $model->credit_price,
                'number_results' => $validatedData['numberResults'],
                'total_cost' => $creditCost
            ]);

            // Check if user has enough credits using the new credit system
            if ($user->total_remaining_credits < $creditCost) {
                return response()->json([
                    'error' => 'Insufficient credits',
                    'required' => $creditCost,
                    'available' => $user->total_remaining_credits
                ], 400);
            }

            // Start database transaction
            DB::beginTransaction();

            try {
                // Create Generate record
                $generate = Generate::create([
                    'user_id' => $user->id,
                    'name' => $validatedData['name'] ?? 'Generated Image',
                    'content' => json_encode($validatedData),
                    'type' => 'image',
                    'status' => 'processing',
                    'share' => $validatedData['share'] ?? 'private',
                    'credit_cost' => $creditCost,
                    'result_url' => null
                ]);

                // Deduct credits using the proper credit system
                $userCreditController = new \App\Http\Controllers\Api\UserCreditController();
                $creditResult = $userCreditController->useCredits($user, $creditCost);
                
                if (!$creditResult['success']) {
                    DB::rollBack();
                    return response()->json([
                        'error' => $creditResult['message'],
                        'required' => $creditCost,
                        'available' => $creditResult['available'] ?? 0
                    ], 400);
                }

                // Commit transaction
                DB::commit();

                Log::info('Image generation started', [
                    'user_id' => $user->id,
                    'generate_id' => $generate->id,
                    'credit_cost' => $creditCost
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Database transaction failed', ['error' => $e->getMessage()]);
                return response()->json(['error' => 'Failed to create generation record'], 500);
            }

            // Validate Runware request
            $runwareValidated = $this->runwareService->validateRequest($validatedData);
            
            // Build Runware request
            $runwareRequest = $this->runwareService->buildRequest($runwareValidated);

            try {
                // Call Runware API
                $runwareResponse = $this->runwareService->generateImage($runwareRequest);

                // Extract image data with seed and URL information
                $imageResults = [];
                Log::info('Processing Runware response', ['response_structure' => $runwareResponse]);
                
                if (isset($runwareResponse['data']) && is_array($runwareResponse['data'])) {
                    // Collect Runware URLs for batch upload to S3
                    $runwareUrls = [];
                    $seedData = [];
                    
                    foreach ($runwareResponse['data'] as $imageData) {
                        if (isset($imageData['imageURL']) && isset($imageData['seed'])) {
                            $runwareUrls[] = $imageData['imageURL'];
                            $seedData[] = $imageData['seed'];
                        }
                    }
                    
                    // Upload images to S3 if S3 is configured
                    Log::info('Checking S3 configuration', [
                        'is_configured' => $this->imageStorageService->isS3Configured(),
                        'urls_count' => count($runwareUrls)
                    ]);
                    
                    if ($this->imageStorageService->isS3Configured() && !empty($runwareUrls)) {
                        try {
                            Log::info('Starting S3 upload process', ['urls_count' => count($runwareUrls)]);
                            
                            $uploadResult = $this->imageStorageService->uploadMultipleImagesFromUrls($runwareUrls, 'generated-images');
                            
                            Log::info('S3 upload result', ['result' => $uploadResult]);
                            
                            if (!empty($uploadResult['uploaded_urls'])) {
                                // Use S3 URLs
                                foreach ($uploadResult['uploaded_urls'] as $index => $s3Url) {
                                    $imageResults[] = [
                                        'seed' => $seedData[$index] ?? null,
                                        'url' => $s3Url
                                    ];
                                }
                                
                                Log::info('Images uploaded to S3 successfully', [
                                    'uploaded_count' => count($uploadResult['uploaded_urls']),
                                    'errors_count' => count($uploadResult['errors'])
                                ]);
                            } else {
                                // Fallback to Runware URLs if S3 upload fails
                                Log::warning('S3 upload failed, using Runware URLs as fallback');
                                foreach ($runwareUrls as $index => $runwareUrl) {
                                    $imageResults[] = [
                                        'seed' => $seedData[$index] ?? null,
                                        'url' => $runwareUrl
                                    ];
                                }
                            }
                        } catch (\Exception $s3Error) {
                            Log::error('S3 upload error, using Runware URLs as fallback', ['error' => $s3Error->getMessage()]);
                            // Fallback to Runware URLs
                            foreach ($runwareUrls as $index => $runwareUrl) {
                                $imageResults[] = [
                                    'seed' => $seedData[$index] ?? null,
                                    'url' => $runwareUrl
                                ];
                            }
                        }
                    } else {
                        // S3 not configured, use Runware URLs
                        Log::info('S3 not configured or no URLs, using Runware URLs', [
                            'is_configured' => $this->imageStorageService->isS3Configured(),
                            'urls_empty' => empty($runwareUrls)
                        ]);
                        foreach ($runwareUrls as $index => $runwareUrl) {
                            $imageResults[] = [
                                'seed' => $seedData[$index] ?? null,
                                'url' => $runwareUrl
                            ];
                        }
                    }
                }
                
                Log::info('Extracted image results', ['results' => $imageResults, 'count' => count($imageResults)]);

                if (empty($imageResults)) {
                    throw new \Exception('No images returned from Runware API');
                }

                // Store additional data for debugging and future use
                $resultData = [
                    'runware_response' => $runwareResponse,
                    'task_id' => $runwareRequest['taskUUID'] ?? null
                ];

                // Update Generate record with results
                $generate->update([
                    'status' => 'completed',
                    'result_url' => json_encode($imageResults), // Store seed and URL structure
                    'file_patch' => json_encode($resultData)
                ]);

                Log::info('Image generation completed successfully', [
                    'generate_id' => $generate->id,
                    'images_count' => count($imageResults),
                    'image_results' => $imageResults
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $generate->id,
                        'status' => 'completed',
                        'images' => $imageResults, // Return seed and URL structure
                        'credit_cost' => $creditCost,
                        'remaining_credits' => $user->fresh()->total_remaining_credits,
                        'share' => $validatedData['share'] ?? 'private'
                    ]
                ]);

            } catch (\Exception $e) {
                // Update Generate record with error
                $generate->update([
                    'status' => 'failed',
                    'file_patch' => json_encode(['error' => $e->getMessage()])
                ]);

                // Refund credits on failure
                DB::beginTransaction();
                try {
                    // Create refund credit record
                    $refundCredit = \App\Models\UserCredit::create([
                        'user_id' => $user->id,
                        'total_credits' => $creditCost,
                        'used_credits' => 0,
                        'remaining_credits' => $creditCost,
                        'credit_type' => 'refund',
                        'expires_at' => now()->addYear(),
                        'notes' => 'Refund for failed image generation (Generate ID: ' . $generate->id . ')'
                    ]);
                    
                    DB::commit();
                    Log::info('Credits refunded due to generation failure', [
                        'user_id' => $user->id,
                        'refunded_credits' => $creditCost,
                        'refund_credit_id' => $refundCredit->id
                    ]);
                } catch (\Exception $refundError) {
                    DB::rollBack();
                    Log::error('Failed to refund credits', [
                        'user_id' => $user->id,
                        'credits' => $creditCost,
                        'error' => $refundError->getMessage()
                    ]);
                }

                Log::error('Image generation failed', [
                    'generate_id' => $generate->id,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'error' => 'Image generation failed: ' . $e->getMessage(),
                    'generate_id' => $generate->id
                ], 500);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected error in image generation', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get generation status
     */
    public function getGenerationStatus($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $generate = Generate::where('id', $id)
                ->where('user_id', $user->id)
                ->where('type', 'image')
                ->first();

            if (!$generate) {
                return response()->json(['error' => 'Generation not found'], 404);
            }

            $response = [
                'id' => $generate->id,
                'status' => $generate->status,
                'name' => $generate->name,
                'created_at' => $generate->created_at,
                'credit_cost' => $generate->credit_cost
            ];

            if ($generate->status === 'completed' && $generate->result_url) {
                $response['images'] = json_decode($generate->result_url, true);
            }

            if ($generate->status === 'failed' && $generate->file_patch) {
                $fileData = json_decode($generate->file_patch, true);
                if (isset($fileData['error'])) {
                    $response['error'] = $fileData['error'];
                }
            }

            return response()->json(['data' => $response]);

        } catch (\Exception $e) {
            Log::error('Error getting generation status', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Upscale image using Runware API
     */
    public function upscaleImage(Request $request)
    {
        try {
            // Validate request
            $validatedData = $request->validate([
                'inputImage' => 'required|string',
                'outputFormat' => 'required|string|in:jpg,png,webp',
                'upscaleFactor' => 'required|integer|in:2,4,8'
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized, please login.'], 401);
            }

            // Check user credits (upscale costs 5 credits)
            $creditCost = 5;
            if ($user->credits < $creditCost) {
                return response()->json(['error' => 'Insufficient credits. Please top up your account.'], 400);
            }

            // Create Generate record
            $generate = Generate::create([
                'user_id' => $user->id,
                'type' => 'upscale',
                'status' => 'processing',
                'name' => 'Image Upscale ' . now()->format('Y-m-d H:i:s'),
                'content' => json_encode([
                    'outputFormat' => $validatedData['outputFormat'],
                    'upscaleFactor' => $validatedData['upscaleFactor']
                ]),
                'credit_cost' => $creditCost
            ]);

            // Build Runware request
            $runwareRequest = $this->runwareService->buildUpscaleRequest(
                $validatedData['inputImage'],
                $validatedData['outputFormat'],
                $validatedData['upscaleFactor']
            );

            // Call Runware API
            $response = $this->runwareService->upscaleImage($runwareRequest);

            // Process response
            if (isset($response['data']) && !empty($response['data'])) {
                $imageData = $response['data'][0];
                
                if (isset($imageData['imageURL'])) {
                    $runwareUrl = $imageData['imageURL'];
                    $finalUrl = $runwareUrl; // Default to Runware URL
                    
                    // Try to upload to S3 if configured
                    if ($this->imageStorageService->isS3Configured()) {
                        try {
                            Log::info('Uploading upscaled image to S3', ['runware_url' => $runwareUrl]);
                            
                            $s3Url = $this->imageStorageService->uploadImageFromUrl($runwareUrl, 'upscaled-images');
                            $finalUrl = $s3Url; // Use S3 URL if upload successful
                            
                            Log::info('Upscaled image uploaded to S3 successfully', [
                                'runware_url' => $runwareUrl,
                                's3_url' => $s3Url
                            ]);
                        } catch (\Exception $s3Error) {
                            Log::error('S3 upload failed for upscaled image, using Runware URL as fallback', [
                                'error' => $s3Error->getMessage(),
                                'runware_url' => $runwareUrl
                            ]);
                            // Keep using Runware URL as fallback
                        }
                    } else {
                        Log::info('S3 not configured, using Runware URL for upscaled image');
                    }
                    
                    // Update generate record with success
                    $generate->update([
                        'status' => 'completed',
                        'result_url' => $finalUrl,
                        'file_patch' => json_encode($imageData)
                    ]);

                    // Deduct credits
                    $user->decrement('credits', $creditCost);

                    return response()->json([
                        'success' => true,
                        'data' => [
                            'id' => $generate->id,
                            'status' => 'completed',
                            'imageUrl' => $finalUrl,
                            'credit_cost' => $creditCost,
                            'remaining_credits' => $user->credits - $creditCost
                        ]
                    ]);
                }
            }

            // Handle failure
            $generate->update([
                'status' => 'failed',
                'file_patch' => json_encode(['error' => 'No image data received from API'])
            ]);

            return response()->json(['error' => 'Failed to upscale image'], 500);

        } catch (ValidationException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('Error upscaling image', ['error' => $e->getMessage()]);
            
            // Update generate record if it exists
            if (isset($generate)) {
                $generate->update([
                    'status' => 'failed',
                    'file_patch' => json_encode(['error' => $e->getMessage()])
                ]);
            }

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
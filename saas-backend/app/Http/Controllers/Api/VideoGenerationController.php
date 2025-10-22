<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use App\Models\UserCredit;
use App\Services\VideoGenApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class VideoGenerationController extends Controller
{
    protected $videoGenApiService;

    public function __construct(VideoGenApiService $videoGenApiService)
    {
        $this->videoGenApiService = $videoGenApiService;
    }

    /**
     * Generate video using VideoGenAPI
     */
    public function generateVideo(Request $request)
    {
        try {
            // Validate request
            $validatedData = $request->validate([
                'positivePrompt' => 'required|string|max:4000',
                'duration' => 'nullable|integer|min:10|max:15',
                'model' => 'nullable|string|in:portrait,landscape,portrait-hd,landscape-hd',
                'inputImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Check user credits (video generation costs more than images)
            $creditCost = $this->calculateVideoCreditCost($validatedData);
            $userCredits = $user->total_remaining_credits;
            if ($userCredits < $creditCost) {
                return response()->json([
                    'error' => 'Insufficient credits. Please top up your account.',
                    'required' => $creditCost,
                    'available' => $userCredits
                ], 400);
            }

            // Handle image upload if provided (for image-to-video)
            $inputImageUrl = null;
            if ($request->hasFile('inputImage')) {
                $inputImageUrl = $this->uploadInputImage($request->file('inputImage'));
            }

            // Prepare VideoGenAPI request
            $videoGenData = [
                'prompt' => $validatedData['positivePrompt'],
                'duration' => $validatedData['duration'] ?? 10,
                'model' => $validatedData['model'] ?? ($inputImageUrl ? 'landscape' : 'portrait'),
            ];

            // Add image_url for image-to-video
            if ($inputImageUrl) {
                $videoGenData['image_url'] = $inputImageUrl;
            }

            // Create generate record
            $generate = Generate::create([
                'user_id' => $user->id,
                'name' => 'Video Generation - ' . substr($validatedData['positivePrompt'], 0, 50),
                'type' => 'video',
                'status' => 'pending',
                'prompt' => $validatedData['positivePrompt'],
                'model' => $videoGenData['model'],
                'settings' => json_encode([
                    'duration' => $videoGenData['duration'],
                    'model' => $videoGenData['model'],
                    'image_url' => $inputImageUrl,
                ]),
                'credit_cost' => $creditCost,
                'share' => false
            ]);

            // Deduct credits using UserCreditController
            $userCreditController = app(\App\Http\Controllers\Api\UserCreditController::class);
            $creditResult = $userCreditController->useCredits($user, $creditCost);

            // Call VideoGenAPI
            try {
                // Set longer execution time for video generation
                set_time_limit(300); // 5 minutes
                
                $response = $this->videoGenApiService->generateVideo($videoGenData);
                
                // Store generation_id for tracking
                $generate->update([
                    'status' => $response['status'] ?? 'pending',
                    'task_id' => $response['generation_id'],
                    'api_response' => json_encode($response)
                ]);

                // Try to poll for completion with 1-minute timeout
                try {
                    $pollResponse = $this->videoGenApiService->pollGenerationStatus($response['generation_id'], 60, 5);
                    
                    if (isset($pollResponse['timeout']) && $pollResponse['timeout']) {
                        // Timeout reached - return with task_id for later checking
                        return response()->json([
                            'success' => true,
                            'message' => 'Video generation is processing. Please check back later.',
                            'data' => [
                                'id' => $generate->id,
                                'generation_id' => $response['generation_id'],
                                'task_id' => $response['generation_id'],
                                'status' => 'processing',
                                'remainingCredits' => $user->fresh()->total_remaining_credits,
                                'message' => 'Video generation is still processing. Use the task_id to check status later.'
                            ]
                        ]);
                    }
                    
                    // Generation completed or failed within timeout
                    if ($pollResponse['status'] === 'completed') {
                        $generate->update([
                            'status' => 'completed',
                            'result_url' => $pollResponse['video_url'] ?? null,
                            'completed_at' => now(),
                            'api_response' => json_encode($pollResponse)
                        ]);
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Video generation completed successfully',
                            'data' => [
                                'id' => $generate->id,
                                'generation_id' => $response['generation_id'],
                                'status' => 'completed',
                                'video_url' => $pollResponse['video_url'] ?? null,
                                'remainingCredits' => $user->fresh()->total_remaining_credits,
                                'processing_time' => $pollResponse['processing_time'] ?? null,
                                'completed_at' => $pollResponse['completed_at'] ?? null
                            ]
                        ]);
                    } else if (in_array($pollResponse['status'], ['failed', 'error'])) {
                        $generate->update([
                            'status' => 'failed',
                            'error_message' => $pollResponse['message'] ?? 'Generation failed',
                            'api_response' => json_encode($pollResponse)
                        ]);
                        
                        // Refund credits on failure
                        UserCredit::create([
                            'user_id' => $user->id,
                            'pricing_plan_id' => null,
                            'total_credits' => $creditCost,
                            'used_credits' => 0,
                            'remaining_credits' => $creditCost,
                            'expires_at' => now()->addDays(31),
                            'credit_type' => 'refund',
                            'notes' => 'Refund for failed video generation'
                        ]);
                        
                        return response()->json([
                            'error' => 'Video generation failed: ' . ($pollResponse['message'] ?? 'Unknown error'),
                            'generate_id' => $generate->id
                        ], 500);
                    }
                    
                } catch (\Exception $pollError) {
                    Log::warning('Video polling error: ' . $pollError->getMessage());
                    // Continue with original response if polling fails
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Video generation started successfully',
                    'data' => [
                        'id' => $generate->id,
                        'generation_id' => $response['generation_id'],
                        'task_id' => $response['generation_id'],
                        'request_id' => $response['request_id'] ?? null,
                        'status' => $response['status'] ?? 'pending',
                        'remainingCredits' => $user->fresh()->total_remaining_credits,
                        'message' => 'Video generation is processing'
                    ]
                ]);

            } catch (\Exception $e) {
                Log::error('Video Gen  Error: ' . $e->getMessage());
                
                // Refund credits on error
                UserCredit::create([
                    'user_id' => $user->id,
                    'pricing_plan_id' => null,
                    'total_credits' => $creditCost,
                    'used_credits' => 0,
                    'remaining_credits' => $creditCost,
                    'expires_at' => now()->addDays(31),
                    'credit_type' => 'refund',
                    'notes' => 'Refund for failed video generation'
                ]);
                
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);
                
                return response()->json([
                    'error' => 'Video generation service unavailable: ' . $e->getMessage(),
                    'generate_id' => $generate->id
                ], 500);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Video Generation Error: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get video generation status
     */
    public function getGenerationStatus($id)
    {
        try {
            $user = Auth::user();
            $generate = Generate::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$generate) {
                return response()->json(['error' => 'Generation not found'], 404);
            }

            // If status is still pending or processing, check with VideoGenAPI
            if (in_array($generate->status, ['pending', 'processing']) && $generate->task_id) {
                try {
                    $apiStatus = $this->videoGenApiService->getGenerationStatus($generate->task_id);
                    
                    // Update local status based on API response
                    if (isset($apiStatus['status'])) {
                        $newStatus = $apiStatus['status'];
                        $updateData = ['status' => $newStatus];
                        
                        // If completed, save the video URL and additional data
                        if ($newStatus === 'completed') {
                            if (isset($apiStatus['video_url'])) {
                                $updateData['result_url'] = $apiStatus['video_url'];
                            }
                            $updateData['completed_at'] = isset($apiStatus['completed_at']) 
                                ? $apiStatus['completed_at'] 
                                : now();
                            
                            // Store additional response data
                            $updateData['api_response'] = json_encode($apiStatus);
                            
                        } elseif (in_array($newStatus, ['failed', 'error'])) {
                            $updateData['error_message'] = $apiStatus['message'] ?? $apiStatus['error'] ?? 'Generation failed';
                            $updateData['completed_at'] = now();
                            $updateData['api_response'] = json_encode($apiStatus);
                        }
                        
                        $generate->update($updateData);
                        $generate->refresh();
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to check VideoGenAPI status: ' . $e->getMessage());
                }
            }

            // Prepare response data
            $responseData = [
                'id' => $generate->id,
                'status' => $generate->status,
                'videoUrl' => $generate->result_url,
                'prompt' => $generate->prompt,
                'model' => $generate->model,
                'settings' => json_decode($generate->settings, true),
                'creditCost' => $generate->credit_cost,
                'createdAt' => $generate->created_at,
                'completedAt' => $generate->completed_at,
                'errorMessage' => $generate->error_message,
                'generation_id' => $generate->task_id,
                'task_id' => $generate->task_id
            ];

            // Add additional data from API response if available
            if ($generate->api_response) {
                $apiData = json_decode($generate->api_response, true);
                if ($apiData) {
                    $responseData['processing_time'] = $apiData['processing_time'] ?? null;
                    $responseData['resolution'] = $apiData['resolution'] ?? null;
                    $responseData['fps'] = $apiData['fps'] ?? null;
                    $responseData['aspect_ratio'] = $apiData['aspect_ratio'] ?? null;
                    $responseData['style'] = $apiData['style'] ?? null;
                    $responseData['seed'] = $apiData['seed'] ?? null;
                    $responseData['type'] = $apiData['type'] ?? null;
                    $responseData['model_info'] = $apiData['model'] ?? null;
                }
            }

            return response()->json($responseData);

        } catch (\Exception $e) {
            Log::error('Get Generation Status Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get user's video generations
     */
    public function getUserGenerations(Request $request)
    {
        try {
            $user = Auth::user();
            $perPage = $request->get('per_page', 10);
            
            $generations = Generate::where('user_id', $user->id)
                ->whereIn('type', ['video'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'data' => $generations->items(),
                'pagination' => [
                    'current_page' => $generations->currentPage(),
                    'last_page' => $generations->lastPage(),
                    'per_page' => $generations->perPage(),
                    'total' => $generations->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get User Generations Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Calculate credit cost for video generation
     */
    private function calculateVideoCreditCost($data)
    {
        // Base cost for video generation
        $baseCost = 50;
        
        // Additional cost based on duration
        $duration = $data['duration'] ?? 10;
        $durationMultiplier = $duration / 10; // 10 seconds = 1x, 15 seconds = 1.5x
        
        // Additional cost based on model quality
        $model = $data['model'] ?? 'portrait';
        $qualityMultiplier = 1;
        if (str_contains($model, 'hd')) {
            $qualityMultiplier = 1.5; // HD models cost 50% more
        }
        
        // Image-to-video costs more than text-to-video
        $typeMultiplier = !empty($data['inputImage']) ? 1.3 : 1.0;
        
        return ceil($baseCost * $durationMultiplier * $qualityMultiplier * $typeMultiplier);
    }

    /**
     * Upload input image for image-to-video
     */
    private function uploadInputImage($file)
    {
        try {
            // Generate unique filename
            $filename = 'video-input-' . time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store file in public disk
            $path = $file->storeAs('video-inputs', $filename, 'public');
            
            // Return full URL
            return Storage::disk('public')->url($path);
            
        } catch (\Exception $e) {
            Log::error('Image Upload Error: ' . $e->getMessage());
            throw new \Exception('Failed to upload input image');
        }
    }
}
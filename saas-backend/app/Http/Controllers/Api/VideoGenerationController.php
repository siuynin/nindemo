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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                'duration' => 'nullable|integer|min:1|max:30',
                'videoModel' => 'required|string|in:sora-2,kling_25,nanobanana-video,pixverse,seedance,wan-25',
                'aspect_ratio' => 'nullable|string|in:16:9,9:16,1:1',
                'resolution' => 'nullable|string|in:720p,1080p',
                'seed' => 'nullable|integer|min:0|max:4294967295',
                'inputImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
                'add_audio' => 'nullable|string|in:true,false',
                'audio_prompt' => 'nullable|string|max:1000',
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
                $uploadedFile = $request->file('inputImage');
                
                Log::info('Processing input image upload', [
                    'has_file' => $request->hasFile('inputImage'),
                    'file_valid' => $uploadedFile->isValid(),
                    'file_size' => $uploadedFile->getSize(),
                    'file_mime' => $uploadedFile->getMimeType(),
                    'original_name' => $uploadedFile->getClientOriginalName(),
                    'extension' => $uploadedFile->getClientOriginalExtension()
                ]);
                
                // Validate file before upload
                if (!$uploadedFile->isValid()) {
                    throw new \Exception('Invalid file upload');
                }
                
                if ($uploadedFile->getSize() > 10240 * 1024) { // 10MB limit
                    throw new \Exception('File size exceeds 10MB limit');
                }
                
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (!in_array(strtolower($uploadedFile->getClientOriginalExtension()), $allowedExtensions)) {
                    throw new \Exception('Invalid file format. Allowed: jpg, jpeg, png, gif, webp');
                }
                
                try {
                    $inputImageUrl = $this->uploadInputImage($uploadedFile);
                    Log::info('Input image uploaded successfully', ['url' => $inputImageUrl]);
                } catch (\Exception $uploadError) {
                    Log::error('Input image upload failed', [
                        'error' => $uploadError->getMessage(),
                        'file_info' => [
                            'size' => $uploadedFile->getSize(),
                            'mime' => $uploadedFile->getMimeType(),
                            'name' => $uploadedFile->getClientOriginalName(),
                            'extension' => $uploadedFile->getClientOriginalExtension()
                        ]
                    ]);
                    throw $uploadError;
                }
            }

            // Get video model and validate duration
            $videoModel = $validatedData['videoModel'];
            $duration = $validatedData['duration'] ?? 10;
            
            // Set duration limits based on video model
            $modelDurationLimits = [
                'sora-2' => ['min' => 10, 'max' => 10],
                'kling_25' => ['min' => 5, 'max' => 10],
                'nanobanana-video' => ['min' => 5, 'max' => 10],
                'pixverse' => ['min' => 5, 'max' => 8],
                'seedance' => ['min' => 5, 'max' => 10],
                'wan-25' => ['min' => 1, 'max' => 30],
            ];
            
            if (isset($modelDurationLimits[$videoModel])) {
                $limits = $modelDurationLimits[$videoModel];
                if ($duration < $limits['min'] || $duration > $limits['max']) {
                    return response()->json([
                        'error' => 'Invalid duration for selected model',
                        'details' => [
                            'videoModel' => $videoModel,
                            'duration' => $duration,
                            'allowed_range' => $limits['min'] . '-' . $limits['max'] . 's',
                        ]
                    ], 422);
                }
            }

            // Prepare VideoGenAPI request
            $videoGenData = [
                'prompt' => $validatedData['positivePrompt'],
                'duration' => $duration,
                'model' => $videoModel,
                'aspect_ratio' => $validatedData['aspect_ratio'] ?? ($inputImageUrl ? 'landscape' : 'portrait'),
                'resolution' => $validatedData['resolution'] ?? '720p',
            ];

            // Add seed if provided
            if (isset($validatedData['seed']) && $validatedData['seed'] !== null) {
                $videoGenData['seed'] = $validatedData['seed'];
            }

            // Add audio fields if provided
            if (isset($validatedData['add_audio']) && $validatedData['add_audio'] === 'true') {
                $videoGenData['add_audio'] = true;
                if (!empty($validatedData['audio_prompt'])) {
                    $videoGenData['audio_prompt'] = $validatedData['audio_prompt'];
                }
            }

            // Add image_url for image-to-video
            if ($inputImageUrl) {
                $videoGenData['image_url'] = $inputImageUrl;
            }

            // Create generate record
            // Debug log to check data being saved
            $contentData = [
                'prompt' => $validatedData['positivePrompt'],
                'model' => $videoModel,
                'settings' => [
                    'duration' => $duration,
                    'video_model' => $videoModel,
                    'aspect_ratio' => $validatedData['aspect_ratio'] ?? ($inputImageUrl ? 'landscape' : 'portrait'),
                    'resolution' => $validatedData['resolution'] ?? '720p',
                    'seed' => $validatedData['seed'] ?? null,
                    'add_audio' => $validatedData['add_audio'] ?? false,
                    'audio_prompt' => $validatedData['audio_prompt'] ?? null,
                ]
            ];
            
            \Log::info('Creating video generation with content:', [
                'user_id' => $user->id,
                'prompt' => $validatedData['positivePrompt'],
                'content_data' => $contentData,
                'content_json' => json_encode($contentData)
            ]);

            $generate = Generate::create([
                'user_id' => $user->id,
                'name' => 'Video Generation - ' . substr($validatedData['positivePrompt'], 0, 50),
                'type' => 'video',
                'status' => 'pending',
                'content' => json_encode($contentData),
                'file_patch' => $inputImageUrl ? json_encode(['input_image_url' => $inputImageUrl]) : null,
                'credit_cost' => $creditCost,
                'share' => 'private',
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
                        // Timeout reached - update status to processing and return with task_id for later checking
                        $generate->update([
                            'status' => 'processing',
                            'api_response' => json_encode($pollResponse)
                        ]);
                        
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
                        $originalVideoUrl = $pollResponse['video_url'] ?? null;
                        $finalVideoUrl = $originalVideoUrl; // Default to original URL
                        
                        // Try to upload to S3 if configured and video URL is available
                        if ($originalVideoUrl && $this->isS3Configured()) {
                            try {
                                Log::info('Uploading completed video to S3 (immediate completion)', [
                                    'generate_id' => $generate->id,
                                    'original_url' => $originalVideoUrl
                                ]);
                                
                                $s3Url = $this->uploadVideoToS3($originalVideoUrl, 'generated-videos');
                                $finalVideoUrl = $s3Url; // Use S3 URL if upload successful
                                
                                Log::info('Video uploaded to S3 successfully (immediate completion)', [
                                    'generate_id' => $generate->id,
                                    'original_url' => $originalVideoUrl,
                                    's3_url' => $s3Url
                                ]);
                            } catch (\Exception $s3Error) {
                                Log::error('S3 upload failed for completed video (immediate completion), using original URL as fallback', [
                                    'generate_id' => $generate->id,
                                    'original_url' => $originalVideoUrl,
                                    'error' => $s3Error->getMessage()
                                ]);
                                // Continue with original URL if S3 upload fails
                            }
                        }
                        
                        $generate->update([
                            'status' => 'completed',
                            'result_url' => $finalVideoUrl,
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
                                'video_url' => $finalVideoUrl,
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
                                $originalVideoUrl = $apiStatus['video_url'];
                                $finalVideoUrl = $originalVideoUrl; // Default to original URL
                                
                                // Try to upload to S3 if configured
                                if ($this->isS3Configured()) {
                                    try {
                                        Log::info('Uploading completed video to S3', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl
                                        ]);
                                        
                                        $s3Url = $this->uploadVideoToS3($originalVideoUrl, 'generated-videos');
                                        $finalVideoUrl = $s3Url; // Use S3 URL if upload successful
                                        
                                        Log::info('Video uploaded to S3 successfully', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl,
                                            's3_url' => $s3Url
                                        ]);
                                    } catch (\Exception $s3Error) {
                                        Log::error('S3 upload failed for completed video, using original URL as fallback', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl,
                                            'error' => $s3Error->getMessage()
                                        ]);
                                        // Continue with original URL if S3 upload fails
                                    }
                                }
                                
                                $updateData['result_url'] = $finalVideoUrl;
                            }
                            $updateData['completed_at'] = isset($apiStatus['completed_at']) 
                                ? $apiStatus['completed_at'] 
                                : now();
                            
                            // Store additional response data - merge with existing
                            $existingApiResponse = json_decode($generate->api_response, true) ?? [];
                            $mergedApiResponse = array_merge($existingApiResponse, $apiStatus);
                            $updateData['api_response'] = json_encode($mergedApiResponse);
                            
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
            $contentData = json_decode($generate->content, true) ?? [];
            $filePatchData = json_decode($generate->file_patch, true) ?? [];
            
            $responseData = [
                'id' => $generate->id,
                'status' => $generate->status,
                'videoUrl' => $generate->result_url,
                'prompt' => $contentData['prompt'] ?? '',
                'model' => $contentData['model'] ?? '',
                'settings' => $contentData['settings'] ?? [],
                'inputImageUrl' => $filePatchData['input_image_url'] ?? null,
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
     * Check video processing status for auto-refresh
     */
    public function checkVideoProcessingStatus(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get specific video IDs from request body, or use all user's processing videos
            $videoIds = $request->input('video_ids', []);
            
            if (!empty($videoIds)) {
                // Check specific videos
                $processingVideos = Generate::where('user_id', $user->id)
                    ->whereIn('type', ['video'])
                    ->whereIn('id', $videoIds)
                    ->whereIn('status', ['pending', 'processing'])
                    ->get();
            } else {
                // Get all processing videos for the user
                $processingVideos = Generate::where('user_id', $user->id)
                    ->whereIn('type', ['video'])
                    ->whereIn('status', ['pending', 'processing'])
                    ->get();
            }

            $updatedVideos = [];

            foreach ($processingVideos as $generate) {
                try {
                    // Check if generation has exceeded 30 minutes timeout
                    $createdAt = $generate->created_at;
                    $thirtyMinutesAgo = now()->subMinutes(30);
                    
                    if ($createdAt->lt($thirtyMinutesAgo)) {
                        // Set status to failed if over 30 minutes
                        $updateData = [
                            'status' => 'failed',
                            'error_message' => 'Video generation timeout after 30 minutes',
                            'completed_at' => now()
                        ];
                        
                        // Update content with timeout error info
                        $existingContent = json_decode($generate->content, true) ?? [];
                        $content = array_merge($existingContent, [
                            'error' => 'Video generation timeout after 30 minutes',
                            'timeout_at' => now()->toISOString()
                        ]);
                        $updateData['content'] = json_encode($content);
                        
                        $generate->update($updateData);
                        $generate->refresh();
                        
                        $updatedVideos[] = [
                            'id' => $generate->id,
                            'status' => $generate->status,
                            'result_url' => $generate->result_url,
                            'error_message' => $generate->error_message,
                            'task_id' => $generate->task_id
                        ];
                        
                        Log::info('Video generation ' . $generate->id . ' marked as failed due to 30-minute timeout');
                        continue;
                    }

                    if ($generate->task_id) {
                        // Check status from VideoGenAPI
                        $apiStatus = $this->videoGenApiService->getGenerationStatus($generate->task_id);
                        
                        $newStatus = $this->mapApiStatusToLocal($apiStatus['status'] ?? 'unknown');
                        
                        if ($newStatus !== $generate->status) {
                            $updateData = ['status' => $newStatus];
                            
                            if ($newStatus === 'completed' && isset($apiStatus['video_url'])) {
                                $originalVideoUrl = $apiStatus['video_url'];
                                $finalVideoUrl = $originalVideoUrl; // Default to original URL
                                
                                // Try to upload to S3 if configured
                                if ($this->isS3Configured()) {
                                    try {
                                        Log::info('Uploading completed video to S3 (batch check)', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl
                                        ]);
                                        
                                        $s3Url = $this->uploadVideoToS3($originalVideoUrl, 'generated-videos');
                                        $finalVideoUrl = $s3Url; // Use S3 URL if upload successful
                                        
                                        Log::info('Video uploaded to S3 successfully (batch check)', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl,
                                            's3_url' => $s3Url
                                        ]);
                                    } catch (\Exception $s3Error) {
                                        Log::error('S3 upload failed for completed video (batch check), using original URL as fallback', [
                                            'generate_id' => $generate->id,
                                            'original_url' => $originalVideoUrl,
                                            'error' => $s3Error->getMessage()
                                        ]);
                                        // Continue with original URL if S3 upload fails
                                    }
                                }
                                
                                $updateData['result_url'] = $finalVideoUrl;
                                $updateData['completed_at'] = isset($apiStatus['completed_at']) 
                                    ? $apiStatus['completed_at'] 
                                    : now();
                                
                                // Update content with existing data plus API response
                                $existingContent = json_decode($generate->content, true) ?? [];
                                $content = array_merge($existingContent, [
                                    'api_response' => $apiStatus
                                ]);
                                $updateData['content'] = json_encode($content);
                                
                            } elseif (in_array($newStatus, ['failed', 'error'])) {
                                $updateData['error_message'] = $apiStatus['message'] ?? $apiStatus['error'] ?? 'Generation failed';
                                $updateData['completed_at'] = now();
                                
                                // Update content with existing data plus error info
                                $existingContent = json_decode($generate->content, true) ?? [];
                                $content = array_merge($existingContent, [
                                    'error' => $updateData['error_message']
                                ]);
                                $updateData['content'] = json_encode($content);
                            }
                            
                            $generate->update($updateData);
                            $generate->refresh();
                            
                            // Get updated content data for response
                            $contentData = json_decode($generate->content, true) ?? [];
                            
                            $updatedVideos[] = [
                                'id' => $generate->id,
                                'status' => $generate->status,
                                'result_url' => $generate->result_url,
                                'error_message' => $generate->error_message,
                                'task_id' => $generate->task_id
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to check VideoGenAPI status for generation ' . $generate->id . ': ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'updated_videos' => $updatedVideos,
                'total_processing' => $processingVideos->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Check Video Processing Status Error: ' . $e->getMessage());
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

            // Transform data to include parsed content and proper prompt
            $transformedGenerations = [];
            foreach ($generations->items() as $generation) {
                // Parse content JSON to get prompt and settings
                $contentData = json_decode($generation->content, true) ?? [];
                
                // Get prompt from content data
                $prompt = $contentData['prompt'] ?? $contentData['positivePrompt'] ?? '';
                
                $transformedGenerations[] = [
                    'id' => $generation->id,
                    'prompt' => $prompt,
                    'status' => $generation->status,
                    'result_url' => $generation->result_url,
                    'created_at' => $generation->created_at,
                    'completed_at' => $generation->completed_at,
                    'error_message' => $generation->error_message,
                    'credit_cost' => $generation->credit_cost,
                    'task_id' => $generation->task_id,
                    'generation_id' => $generation->task_id,
                    'content' => $generation->content,
                    'input_image_url' => $generation->file_patch ? json_decode($generation->file_patch, true)['input_image_url'] ?? null : null,
                    'settings' => $contentData['settings'] ?? []
                ];
            }

            // Debug log to check data being returned
            \Log::info('Video generations being returned:', [
                'user_id' => $user->id,
                'total_generations' => $generations->total(),
                'first_generation_sample' => $transformedGenerations ? [
                    'id' => $transformedGenerations[0]['id'] ?? null,
                    'prompt' => $transformedGenerations[0]['prompt'] ?? null,
                    'content' => $transformedGenerations[0]['content'] ?? null
                ] : 'no_items'
            ]);

            return response()->json([
                'data' => $transformedGenerations,
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
     * Upload input image to S3 (forced, no fallback to local storage)
     */
    private function uploadInputImage($file)
    {
        try {
            $s3Config = config('filesystems.disks.s3');
            
            Log::info('Starting S3 upload', [
                's3_configured' => !empty($s3Config['key']) && !empty($s3Config['secret']),
                'file_info' => [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'extension' => $file->getClientOriginalExtension(),
                    'mime' => $file->getMimeType()
                ]
            ]);
            
            // Check if S3 is properly configured
            if (empty($s3Config['key']) || empty($s3Config['secret'])) {
                throw new \Exception('AWS S3 credentials not configured. S3 upload is required for video generation.');
            }
            
            // Generate unique filename with timestamp and random string
            $filename = 'video-inputs/' . date('Y/m/d') . '/video-input-' . time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            Log::info('Generated S3 filename', ['directory' => dirname($filename), 'filename' => basename($filename)]);
            
            try {
                // Try to store file in S3 with directory structure (without ACL/visibility)
                $path = Storage::disk('s3')->putFileAs(
                    dirname($filename), // directory
                    $file, // file
                    basename($filename) // filename
                    // Removed 'public' visibility parameter as bucket doesn't support ACLs
                );
                
                if (!$path) {
                    throw new \Exception('Failed to store file in S3 directory');
                }
                
                $s3Url = Storage::disk('s3')->url($filename);
                
            } catch (\Exception $dirException) {
                // If directory upload fails, try uploading to root directory
                Log::warning('Failed to upload to directory, trying root: ' . $dirException->getMessage(), [
                    'error_class' => get_class($dirException)
                ]);
                
                $fallbackFilename = 'video-input-' . time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
                
                $path = Storage::disk('s3')->putFileAs(
                    '', // root directory
                    $file, // file
                    $fallbackFilename // filename
                    // Removed 'public' visibility parameter as bucket doesn't support ACLs
                );
                
                if (!$path) {
                    throw new \Exception('Failed to upload to S3 root directory. S3 upload is required for video generation.');
                }
                
                $s3Url = Storage::disk('s3')->url($fallbackFilename);
                $filename = $fallbackFilename;
            }
            
            Log::info('Image uploaded to S3 successfully', [
                'path' => $filename,
                'url' => $s3Url,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);
            
            return $s3Url;
            
        } catch (\Exception $e) {
            Log::error('S3 Upload Error (FORCED): ' . $e->getMessage(), [
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'error' => $e->getMessage(),
                'error_class' => get_class($e)
            ]);
            
            // No fallback - throw error to force S3 usage
            throw new \Exception('Failed to upload image to S3: ' . $e->getMessage() . '. S3 upload is required for video generation.');
        }
    }

    /**
     * Upload input image to local storage as fallback
     */
    private function uploadInputImageLocal($file)
    {
        try {
            // Create directory structure for local storage
            $datePath = date('Y/m/d');
            $directory = 'video-inputs/' . $datePath;
            
            Log::info('Starting local upload', [
                'directory' => $directory,
                'date_path' => $datePath,
                'original_name' => $file->getClientOriginalName(),
                'extension' => $file->getClientOriginalExtension(),
                'size' => $file->getSize()
            ]);
            
            // Ensure directory exists
            $fullDirectory = storage_path('app/public/' . $directory);
            Log::info('Checking directory', ['full_path' => $fullDirectory, 'exists' => file_exists($fullDirectory)]);
            
            if (!file_exists($fullDirectory)) {
                $created = mkdir($fullDirectory, 0755, true);
                Log::info('Creating directory', ['path' => $fullDirectory, 'created' => $created]);
            }
            
            // Generate unique filename
            $filename = 'video-input-' . time() . '-' . uniqid() . '.' . $file->getClientOriginalExtension();
            Log::info('Generated filename', ['filename' => $filename]);
            
            // Store in public disk for web access
            $path = $file->storeAs($directory, $filename, [
                'disk' => 'public',
                'visibility' => 'public'
            ]);
            
            Log::info('File stored successfully', ['path' => $path]);
            
            if (!$path) {
                throw new \Exception('Failed to store file locally');
            }
            
            // Return public URL
            $publicUrl = Storage::disk('public')->url($path);
            
            Log::info('Image uploaded to local storage successfully', [
                'path' => $path,
                'url' => $publicUrl,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);
            
            return $publicUrl;
            
        } catch (\Exception $e) {
            Log::error('Local Image Upload Error: ' . $e->getMessage(), [
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Failed to upload input image: ' . $e->getMessage());
        }
    }

    /**
     * Test endpoint for image upload
     */
    public function testUpload(Request $request)
    {
        try {
            Log::info('Test upload endpoint called', [
                'has_file' => $request->hasFile('inputImage'),
                'all_files' => $request->allFiles()
            ]);
            
            if (!$request->hasFile('inputImage')) {
                return response()->json([
                    'error' => 'No inputImage file provided',
                    'files_available' => array_keys($request->allFiles())
                ], 400);
            }
            
            $uploadedFile = $request->file('inputImage');
            Log::info('Processing test upload', [
                'file_info' => [
                    'name' => $uploadedFile->getClientOriginalName(),
                    'size' => $uploadedFile->getSize(),
                    'extension' => $uploadedFile->getClientOriginalExtension(),
                    'mime' => $uploadedFile->getMimeType(),
                    'is_valid' => $uploadedFile->isValid()
                ]
            ]);
            
            $imageUrl = $this->uploadInputImage($uploadedFile);
            
            return response()->json([
                'success' => true,
                'url' => $imageUrl,
                'file_info' => [
                    'name' => $uploadedFile->getClientOriginalName(),
                    'size' => $uploadedFile->getSize(),
                    'extension' => $uploadedFile->getClientOriginalExtension()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Test upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload video from URL to S3
     * 
     * @param string $videoUrl
     * @param string $folder
     * @return string S3 URL
     * @throws \Exception
     */
    private function uploadVideoToS3(string $videoUrl, string $folder = 'generated-videos'): string
    {
        try {
            Log::info('Starting video upload to S3', [
                'video_url' => $videoUrl,
                'folder' => $folder
            ]);

            // Check if S3 is configured
            if (empty(env('AWS_ACCESS_KEY_ID')) || 
                empty(env('AWS_SECRET_ACCESS_KEY')) || 
                empty(env('AWS_BUCKET')) || 
                empty(env('AWS_DEFAULT_REGION'))) {
                throw new \Exception('S3 is not properly configured');
            }

            // Download video from URL with extended timeout for large video files
            $response = Http::timeout(300)->get($videoUrl); // 5 minutes timeout
            
            if (!$response->successful()) {
                throw new \Exception('Failed to download video from URL: ' . $videoUrl . ' (HTTP ' . $response->status() . ')');
            }

            $videoContent = $response->body();
            $contentLength = strlen($videoContent);
            
            Log::info('Video downloaded successfully', [
                'video_url' => $videoUrl,
                'content_length' => $contentLength,
                'content_type' => $response->header('Content-Type')
            ]);

            // Generate unique filename with proper extension
            $extension = $this->getVideoExtensionFromUrl($videoUrl, $response->header('Content-Type'));
            $filename = $folder . '/' . date('Y/m') . '/' . 'video-' . time() . '-' . Str::random(8) . '.' . $extension;
            
            // Upload to S3
            $uploaded = Storage::disk('s3')->put($filename, $videoContent);
            
            if (!$uploaded) {
                throw new \Exception('Failed to upload video to S3');
            }

            // Get the public URL
            $s3Url = Storage::disk('s3')->url($filename);
            
            Log::info('Video uploaded to S3 successfully', [
                'original_url' => $videoUrl,
                's3_url' => $s3Url,
                'filename' => $filename,
                'file_size' => $contentLength
            ]);

            return $s3Url;
            
        } catch (\Exception $e) {
            Log::error('Video upload to S3 failed', [
                'video_url' => $videoUrl,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get video file extension from URL or content type
     * 
     * @param string $url
     * @param string|null $contentType
     * @return string
     */
    private function getVideoExtensionFromUrl(string $url, ?string $contentType = null): string
    {
        // Try to get extension from URL first
        $urlPath = parse_url($url, PHP_URL_PATH);
        if ($urlPath) {
            $extension = pathinfo($urlPath, PATHINFO_EXTENSION);
            if (in_array(strtolower($extension), ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'])) {
                return strtolower($extension);
            }
        }

        // Try to get extension from content type
        if ($contentType) {
            $mimeToExtension = [
                'video/mp4' => 'mp4',
                'video/avi' => 'avi',
                'video/quicktime' => 'mov',
                'video/x-ms-wmv' => 'wmv',
                'video/x-flv' => 'flv',
                'video/webm' => 'webm',
                'video/x-matroska' => 'mkv'
            ];
            
            if (isset($mimeToExtension[$contentType])) {
                return $mimeToExtension[$contentType];
            }
        }

        // Default to mp4 if we can't determine the extension
        return 'mp4';
    }

    /**
     * Check if S3 is configured
     * 
     * @return bool
     */
    private function isS3Configured(): bool
    {
        return !empty(env('AWS_ACCESS_KEY_ID')) && 
               !empty(env('AWS_SECRET_ACCESS_KEY')) && 
               !empty(env('AWS_BUCKET')) && 
               !empty(env('AWS_DEFAULT_REGION'));
    }

    /**
     * Map API status to local status
     * 
     * @param string $apiStatus
     * @return string
     */
    private function mapApiStatusToLocal(string $apiStatus): string
    {
        switch (strtolower($apiStatus)) {
            case 'completed':
                return 'completed';
            case 'failed':
            case 'error':
                return 'failed';
            case 'processing':
            case 'pending':
            case 'queued':
            case 'processing':
                return 'processing';
            default:
                Log::warning('Unknown API status received', ['status' => $apiStatus]);
                return 'processing'; // Default to processing for unknown statuses
        }
    }
}
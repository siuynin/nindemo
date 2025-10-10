<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use App\Services\RunwareService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class VideoGenerationController extends Controller
{
    protected $runwareService;

    public function __construct(RunwareService $runwareService)
    {
        $this->runwareService = $runwareService;
    }

    /**
     * Generate video using Runware API
     */
    public function generateVideo(Request $request)
    {
        try {
            // Validate request
            $validatedData = $request->validate([
                'taskType' => 'required|string|in:videoInference',
                'duration' => 'required|integer|min:5|max:10',
                'fps' => 'required|integer|in:24,30',
                'model' => 'required|string',
                'outputFormat' => 'required|string|in:mp4',
                'height' => 'required|integer|in:720,1080',
                'width' => 'required|integer|in:1280,1920',
                'numberResults' => 'required|integer|in:1',
                'includeCost' => 'required|boolean',
                'outputQuality' => 'required|integer|min:70|max:95',
                'positivePrompt' => 'required|string|max:1000',
                'deliveryMethod' => 'required|string|in:async',
                'taskUUID' => 'required|string',
                'inputImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Check user credits (video generation costs more than images)
            $creditCost = $this->calculateVideoCreditCost($validatedData);
            if ($user->credits < $creditCost) {
                return response()->json([
                    'error' => 'Insufficient credits. Please top up your account.',
                    'required' => $creditCost,
                    'available' => $user->credits
                ], 400);
            }

            // Handle image upload if provided (for image-to-video)
            $inputImageUrl = null;
            if ($request->hasFile('inputImage')) {
                $inputImageUrl = $this->uploadInputImage($request->file('inputImage'));
            }

            // Prepare Runware API request
            $runwareData = [
                'taskType' => $validatedData['taskType'],
                'duration' => $validatedData['duration'],
                'fps' => $validatedData['fps'],
                'model' => $validatedData['model'],
                'outputFormat' => $validatedData['outputFormat'],
                'height' => $validatedData['height'],
                'width' => $validatedData['width'],
                'numberResults' => $validatedData['numberResults'],
                'includeCost' => $validatedData['includeCost'],
                'outputQuality' => $validatedData['outputQuality'],
                'positivePrompt' => $validatedData['positivePrompt'],
                'deliveryMethod' => $validatedData['deliveryMethod'],
                'taskUUID' => $validatedData['taskUUID'],
            ];

            // Add frame images if input image is provided
            if ($inputImageUrl) {
                $runwareData['frameImages'] = [
                    [
                        'inputImage' => $inputImageUrl
                    ]
                ];
            }

            // Create generate record
            $generate = Generate::create([
                'user_id' => $user->id,
                'name' => 'Video Generation - ' . substr($validatedData['positivePrompt'], 0, 50),
                'type' => $inputImageUrl ? 'image-to-video' : 'text-to-video',
                'status' => 'processing',
                'prompt' => $validatedData['positivePrompt'],
                'model' => $validatedData['model'],
                'settings' => json_encode([
                    'duration' => $validatedData['duration'],
                    'fps' => $validatedData['fps'],
                    'width' => $validatedData['width'],
                    'height' => $validatedData['height'],
                    'outputQuality' => $validatedData['outputQuality'],
                    'inputImage' => $inputImageUrl,
                    'taskUUID' => $validatedData['taskUUID']
                ]),
                'credit_cost' => $creditCost,
                'share' => false
            ]);

            // Deduct credits
            $user->decrement('credits', $creditCost);

            // Call Runware API
            try {
                $response = $this->runwareService->generateVideo($runwareData);
                
                if (isset($response['error'])) {
                    // Refund credits on API error
                    $user->increment('credits', $creditCost);
                    $generate->update([
                        'status' => 'failed',
                        'error_message' => $response['error']
                    ]);
                    
                    return response()->json([
                        'error' => 'Video generation failed: ' . $response['error']
                    ], 500);
                }

                // Update generate record with API response
                $generate->update([
                    'status' => 'completed',
                    'result_url' => $response['videoUrl'] ?? null,
                    'api_response' => json_encode($response)
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Video generation started successfully',
                    'generateId' => $generate->id,
                    'taskUUID' => $validatedData['taskUUID'],
                    'videoUrl' => $response['videoUrl'] ?? null,
                    'status' => $response['videoUrl'] ? 'completed' : 'processing',
                    'creditCost' => $creditCost,
                    'remainingCredits' => $user->fresh()->credits
                ]);

            } catch (\Exception $e) {
                Log::error('Runware API Error: ' . $e->getMessage());
                
                // Refund credits on API error
                $user->increment('credits', $creditCost);
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);
                
                return response()->json([
                    'error' => 'Video generation service unavailable'
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

            return response()->json([
                'id' => $generate->id,
                'status' => $generate->status,
                'videoUrl' => $generate->result_url,
                'prompt' => $generate->prompt,
                'model' => $generate->model,
                'settings' => json_decode($generate->settings, true),
                'creditCost' => $generate->credit_cost,
                'createdAt' => $generate->created_at,
                'errorMessage' => $generate->error_message
            ]);

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
                ->whereIn('type', ['text-to-video', 'image-to-video'])
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
        $durationMultiplier = $data['duration'] / 5; // 5 seconds = 1x, 10 seconds = 2x
        
        // Additional cost based on resolution
        $resolutionMultiplier = 1;
        if ($data['width'] >= 1920 && $data['height'] >= 1080) {
            $resolutionMultiplier = 1.5; // Full HD costs 50% more
        }
        
        // Additional cost based on quality
        $qualityMultiplier = 1;
        if ($data['outputQuality'] >= 95) {
            $qualityMultiplier = 1.3; // High quality costs 30% more
        } elseif ($data['outputQuality'] >= 85) {
            $qualityMultiplier = 1.1; // Medium quality costs 10% more
        }
        
        return ceil($baseCost * $durationMultiplier * $resolutionMultiplier * $qualityMultiplier);
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
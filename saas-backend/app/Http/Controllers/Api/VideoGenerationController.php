<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use App\Services\RunningHubService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class VideoGenerationController extends Controller
{
    protected $runningHubService;

    public function __construct(RunningHubService $runningHubService)
    {
        $this->runningHubService = $runningHubService;
    }

    /**
     * Generate video using RunningHub API
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

            // Prepare RunningHub API request
            $runningHubData = [
                'prompt' => $validatedData['positivePrompt'],
                'positivePrompt' => $validatedData['positivePrompt'],
                'duration' => $validatedData['duration'] ?? 10,
                'model' => $validatedData['model'] ?? ($inputImageUrl ? 'landscape' : 'portrait'),
            ];

            // Add input image for image-to-video
            if ($inputImageUrl) {
                // Extract filename from URL for RunningHub
                $filename = basename(parse_url($inputImageUrl, PHP_URL_PATH));
                $runningHubData['inputImage'] = $filename;
            }

            // Create generate record
            $generate = Generate::create([
                'user_id' => $user->id,
                'name' => 'Video Generation - ' . substr($validatedData['positivePrompt'], 0, 50),
                'type' => $inputImageUrl ? 'image-to-video' : 'text-to-video',
                'status' => 'processing',
                'prompt' => $validatedData['positivePrompt'],
                'model' => $runningHubData['model'],
                'settings' => json_encode([
                    'duration' => $runningHubData['duration'],
                    'model' => $runningHubData['model'],
                    'inputImage' => $inputImageUrl,
                ]),
                'credit_cost' => $creditCost,
                'share' => false
            ]);

            // Deduct credits using UserCreditController
            $userCreditController = app(\App\Http\Controllers\Api\UserCreditController::class);
            $creditResult = $userCreditController->useCredits($user, $creditCost);

            // Call RunningHub API
            try {
                // Set longer execution time for video generation
                set_time_limit(300); // 5 minutes
                
                $response = $this->runningHubService->generateVideo($runningHubData);
                
                // Store task_id for webhook tracking
                $generate->update([
                    'status' => 'processing',
                    'task_id' => $response['taskId'],
                    'api_response' => json_encode($response)
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Video generation started successfully',
                    'data' => [
                        'id' => $generate->id,
                        'taskId' => $response['taskId'],
                        'status' => 'processing',
                        'remainingCredits' => $user->fresh()->total_remaining_credits,
                        'webhook_info' => 'Results will be delivered automatically when ready'
                    ]
                ]);

            } catch (\Exception $e) {
                Log::error('RunningHub API Error: ' . $e->getMessage());
                
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
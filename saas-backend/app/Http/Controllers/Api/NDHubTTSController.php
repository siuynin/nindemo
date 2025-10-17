<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\TTSRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\AudioStorageService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NDHubTTSController extends Controller
{
    /**
     * Create NDHub TTS generation
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(TTSRequest $request): JsonResponse
    {
        try {
            // Get validated and sanitized data
            $validated = $request->validated();

            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $user = Auth::user();

            // Calculate credit cost (0.01 credit per character)
            $contentLength = strlen($validated['content']);
            $creditCost = $contentLength * 0.01;

            // Check if user has enough credits
            $userCredits = $user->total_remaining_credits;
            if ($userCredits < $creditCost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient credits. Required: ' . $creditCost . ', Available: ' . $userCredits
                ], 400);
            }

            // Create generate record
            $generate = Generate::create([
                'user_id' => $user->id,
                'type' => 'audio',
                'name' => $validated['name'],
                'content' => $validated['content'],
                'status' => 'processing',
                'credit_cost' => $creditCost,
                'task_id' => Str::uuid(), 
            ]);

            // Deduct credits from user using proper credit system
            $userCreditController = new \App\Http\Controllers\Api\UserCreditController();
            $creditResult = $userCreditController->useCredits($user, $creditCost);
            
            if (!$creditResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $creditResult['message']
                ], 400);
            }

            // Make API call to NDHub TTS service
            try {
                // Determine API endpoint based on language
                $apiEndpoint = $validated['lang'] === 'vi' 
                    ? 'https://lib-erp-comic-unified.trycloudflare.com/synthesize'
                    : 'https://seek-spray-foo-george.trycloudflare.com/tts';

                $response = Http::timeout(300)->withOptions([
                    'stream' => true
                ])->post($apiEndpoint, [
                    'lang' => $validated['lang'],
                    'voice' => $validated['voices'],
                    'input' => $validated['content'],
                    'format' => $validated['audio_format'],
                    'speed' => (string)$validated['speed']
                ]);

                if ($response->successful()) {
                    // Get audio content from response
                    $audioContent = $response->body();
                    
                    // Initialize AudioStorageService
                    $audioStorageService = new AudioStorageService();
                    
                    // Generate unique filename
                    $filename = 'ndhub-tts/' . $generate->id . '_' . time();
                    
                    // Try to upload to S3 first, fallback to local storage
                    $resultUrl = null;
                    $filePath = null;
                    
                    if ($audioStorageService->isS3Configured()) {
                        try {
                            // Upload to S3 - uploadAudioContent returns URL string directly
                            $resultUrl = $audioStorageService->uploadAudioContent(
                                $audioContent,
                                $validated['audio_format'],
                                'ndhub-tts'
                            );
                            
                            // Extract filename from URL for logging
                            $filePath = 'ndhub-tts/' . $generate->id . '_' . time() . '.' . $validated['audio_format'];
                            
                            Log::info('Audio uploaded to S3 successfully', [
                                'generate_id' => $generate->id,
                                'file_path' => $filePath,
                                'url' => $resultUrl
                            ]);
                        } catch (\Exception $e) {
                            Log::warning('S3 upload failed, falling back to local storage', [
                                'generate_id' => $generate->id,
                                'error' => $e->getMessage()
                            ]);
                            
                            // Fallback to local storage
                            $localFilename = $filename . '.' . $validated['audio_format'];
                            Storage::disk('public')->put($localFilename, $audioContent);
                            $resultUrl = Storage::disk('public')->url($localFilename);
                            $filePath = $localFilename;
                        }
                    } else {
                        // S3 not configured, use local storage
                        $localFilename = $filename . '.' . $validated['audio_format'];
                        Storage::disk('public')->put($localFilename, $audioContent);
                        $resultUrl = Storage::disk('public')->url($localFilename);
                        $filePath = $localFilename;
                        
                        Log::info('S3 not configured, using local storage', [
                            'generate_id' => $generate->id,
                            'file_path' => $filePath
                        ]);
                    }
                    
                    // Update generate record with success
                    $generate->update([
                        'status' => 'completed',
                        'result_url' => $resultUrl,
                        'file_path' => $filePath,
                        'completed_at' => now()
                    ]);

                    Log::info('NDHub TTS generation completed successfully', [
                        'generate_id' => $generate->id,
                        'user_id' => $user->id,
                        'filename' => $filePath
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'TTS generation completed successfully',
                        'data' => [
                            'id' => $generate->id,
                            'name' => $generate->name,
                            'status' => $generate->status,
                            'credit_cost' => $generate->credit_cost,
                            'task_id' => $generate->task_id,
                            'result_url' => $generate->result_url,
                            'created_at' => $generate->created_at,
                            'completed_at' => $generate->completed_at
                        ]
                    ]);

                } else {
                    // API call failed
                    $errorMessage = 'NDHub TTS API error: ' . $response->status() . ' - ' . $response->body();
                    Log::error($errorMessage, [
                        'generate_id' => $generate->id,
                        'user_id' => $user->id,
                        'response_status' => $response->status(),
                        'response_body' => $response->body()
                    ]);

                    // Update generate record with failure
                    $generate->update([
                        'status' => 'failed',
                        'error_message' => $errorMessage,
                        'completed_at' => now()
                    ]);

                    // Refund credits to user
                    $user->increment('credits', $creditCost);

                    return response()->json([
                        'success' => false,
                        'message' => 'TTS generation failed: ' . $response->body()
                    ], 500);
                }

            } catch (\Exception $e) {
                // Network or other exception
                $errorMessage = 'NDHub TTS API exception: ' . $e->getMessage();
                Log::error($errorMessage, [
                    'generate_id' => $generate->id,
                    'user_id' => $user->id,
                    'exception' => $e->getTraceAsString()
                ]);

                // Update generate record with failure
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $errorMessage,
                    'completed_at' => now()
                ]);

                // Refund credits to user
                $user->increment('credits', $creditCost);

                return response()->json([
                    'success' => false,
                    'message' => 'TTS generation failed: Network error'
                ], 500);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('NDHub TTS Controller error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get user's NDHub TTS generations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $user = Auth::user();
            $perPage = $request->query('per_page', 10);
            $page = $request->query('page', 1);

            $generates = Generate::where('user_id', $user->id)
                ->where('type', 'audio')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $generates
            ]);

        } catch (\Exception $e) {
            Log::error('NDHub TTS index error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get specific NDHub TTS generation
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $user = Auth::user();

            $generate = Generate::where('user_id', $user->id)
                ->where('type', 'audio')
                ->where('id', $id)
                ->first();

            if (!$generate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Generation not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $generate
            ]);

        } catch (\Exception $e) {
            Log::error('NDHub TTS show error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'generate_id' => $id,
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Delete NDHub TTS generation
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            $user = Auth::user();

            $generate = Generate::where('user_id', $user->id)
                ->where('type', 'audio')
                ->where('id', $id)
                ->first();

            if (!$generate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Generation not found'
                ], 404);
            }

            // Delete file from storage if exists
            if ($generate->file_path && Storage::disk('public')->exists($generate->file_path)) {
                Storage::disk('public')->delete($generate->file_path);
            }

            // Delete generate record
            $generate->delete();

            return response()->json([
                'success' => true,
                'message' => 'Generation deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('NDHub TTS destroy error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'generate_id' => $id,
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
}
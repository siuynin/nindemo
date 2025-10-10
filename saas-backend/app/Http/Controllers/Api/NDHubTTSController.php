<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserGenerate;
use App\Models\User;
use Illuminate\Http\Request;
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
    public function create(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'content' => 'required|string|max:10000',
                'lang' => 'required|string|max:10',
                'voices' => 'required|string|max:50',
                'audio_format' => 'required|string|in:mp3,wav,ogg',
                'speed' => 'required|numeric|min:0.5|max:2.0'
            ]);

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
            if ($user->credits < $creditCost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient credits. Required: ' . $creditCost . ', Available: ' . $user->credits
                ], 400);
            }

            // Create generate record
            $generate = UserGenerate::create([
                'user_id' => $user->id,
                'type' => 'ndhub-tts',
                'name' => $validated['name'],
                'content' => $validated['content'],
                'status' => 'processing',
                'credit_cost' => $creditCost,
                'task_id' => Str::uuid(),
                'settings' => json_encode([
                    'lang' => $validated['lang'],
                    'voice' => $validated['voices'],
                    'format' => $validated['audio_format'],
                    'speed' => $validated['speed']
                ])
            ]);

            // Deduct credits from user
            $user->decrement('credits', $creditCost);

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
                            // Upload to S3
                            $s3Result = $audioStorageService->uploadAudioContent(
                                $audioContent,
                                $filename,
                                $validated['audio_format']
                            );
                            
                            if ($s3Result['success']) {
                                $resultUrl = $s3Result['url'];
                                $filePath = $s3Result['path'];
                                
                                Log::info('Audio uploaded to S3 successfully', [
                                    'generate_id' => $generate->id,
                                    'file_path' => $filePath,
                                    'url' => $resultUrl
                                ]);
                            } else {
                                throw new \Exception('S3 upload failed: ' . $s3Result['error']);
                            }
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

            $generates = UserGenerate::where('user_id', $user->id)
                ->where('type', 'ndhub-tts')
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

            $generate = UserGenerate::where('user_id', $user->id)
                ->where('type', 'ndhub-tts')
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

            $generate = UserGenerate::where('user_id', $user->id)
                ->where('type', 'ndhub-tts')
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
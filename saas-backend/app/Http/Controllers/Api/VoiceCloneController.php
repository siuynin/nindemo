<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VoiceClone;
use App\Models\UserCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use getID3;

class VoiceCloneController extends Controller
{
    private $minimaxApiKey;
    private $minimaxApiUrl = 'https://api.ai33.pro/v1m/voice/clone';
    
    // Update the constructor to use S3 disk
    private $fileStorageDisk = 's3'; // Changed from 'public' to 's3'
    
    public function __construct()
    {
        $this->minimaxApiKey = env('ELEVENLABS_API_KEY');
        // Use S3 for file storage by default, fallback to public if S3 not configured
        $this->fileStorageDisk = config('filesystems.disks.s3.bucket') ? 's3' : 'public';
    }
    
    /**
     * Get user's voice clones
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $voiceClones = VoiceClone::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $voiceClones
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching voice clones: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching voice clones'
            ], 500);
        }
    }
    
    /**
     * Create new voice clone
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            // Validate request
            $validator = Validator::make($request->all(), [
                'voice_name' => 'required|string|max:255',
                'preview_text' => 'required|string|max:500',
                'language_tag' => 'required|string|max:50',
                'gender_tag' => 'required|string|in:male,female',
                'need_noise_reduction' => 'required|in:true,false,1,0',
                'platform' => 'string|in:minimax,elevenlabs',
                'file' => 'required|file|mimes:mp3,mpeg|max:20480' // 20MB max
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check user credits (cost: 100 credits per voice clone)
            $creditCost = 100;
            $totalRemainingCredits = $user->total_remaining_credits;
            
            if ($totalRemainingCredits < $creditCost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient credits. Voice clone requires ' . $creditCost . ' credits. You have ' . $totalRemainingCredits . ' credits.'
                ], 402);
            }
            
            // Handle file upload - Updated to use S3 storage
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            // Try to upload file
            try {
                $filePath = $file->storeAs('voice_clones/' . $user->id, $fileName, $this->fileStorageDisk);
                
                // Verify file was uploaded successfully
                if (!Storage::disk($this->fileStorageDisk)->exists($filePath)) {
                    throw new \Exception('File upload failed - file not found after upload');
                }
                
                Log::info('File uploaded successfully', [
                    'file_path' => $filePath,
                    'storage_disk' => $this->fileStorageDisk,
                    'file_size' => $file->getSize(),
                    'file_mime' => $file->getMimeType()
                ]);
                
            } catch (\Exception $uploadException) {
                Log::error('File upload failed: ' . $uploadException->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed: ' . $uploadException->getMessage()
                ], 500);
            }
            
            // Validate audio duration (max 5 minutes) - skip if getID3 fails
            try {
                $audioInfo = $this->getAudioInfo($file);
                if ($audioInfo['duration'] > 300) { // 5 minutes
                    Storage::disk('public')->delete($filePath);
                    return response()->json([
                        'success' => false,
                        'message' => 'Audio duration must not exceed 5 minutes'
                    ], 422);
                }
            } catch (\Exception $audioException) {
                Log::warning('Could not validate audio duration: ' . $audioException->getMessage());
                // Continue anyway, don't fail the upload due to duration validation issues
            }
            
            // Create voice clone record
            $voiceClone = VoiceClone::create([
                'user_id' => $user->id,
                'voice_name' => $request->voice_name,
                'preview_text' => $request->preview_text,
                'language_tag' => $request->language_tag,
                'gender_tag' => $request->gender_tag,
                'need_noise_reduction' => filter_var($request->need_noise_reduction, FILTER_VALIDATE_BOOLEAN),
                'platform' => $request->platform,
                'file_path' => $filePath,
                'status' => 'pending',
                'voice_id' => null
            ]);
            
            // Deduct credits using the proper method
            try {
                $creditResult = app(\App\Http\Controllers\Api\UserCreditController::class)->useCredits($user, $creditCost);
                
                if (!$creditResult['success']) {
                    // Clean up uploaded file if credit deduction failed
                    Storage::disk('public')->delete($filePath);
                    return response()->json([
                        'success' => false,
                        'message' => $creditResult['message']
                    ], 402);
                }
                
                Log::info('Credits deducted successfully for voice clone', [
                    'user_id' => $user->id,
                    'credits_used' => $creditCost,
                    'remaining_credits' => $user->fresh()->total_remaining_credits
                ]);
            } catch (\Exception $creditException) {
                Log::error('Error deducting credits: ' . $creditException->getMessage());
                // Clean up uploaded file if credit deduction failed
                Storage::disk('public')->delete($filePath);
                return response()->json([
                    'success' => false,
                    'message' => 'Error processing credits: ' . $creditException->getMessage()
                ], 500);
            }
            
            // Process voice clone with Minimax API
            $this->processVoiceClone($voiceClone, $filePath);
            
            return response()->json([
                'success' => true,
                'message' => 'Voice clone request submitted successfully',
                'data' => $voiceClone
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error creating voice clone: ' . $e->getMessage());
            
            // Clean up uploaded file if exists
            if (isset($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Error creating voice clone'
            ], 500);
        }
    }
    
    /**
     * Process voice clone with Minimax API
     */
    private function processVoiceClone(VoiceClone $voiceClone, string $filePath)
    {
        try {
            // Update status to processing
            $voiceClone->update(['status' => 'processing']);
            
            // Check if API key is configured
            if (empty($this->minimaxApiKey) || $this->minimaxApiKey === 'your_minimax_api_key_here') {
                Log::warning('Minimax API key is not configured, using mock mode');
                
                // Simulate processing delay
                sleep(2);
                
                // Update voice clone as completed with a mock voice_id
                $voiceClone->update([
                    'status' => 'completed',
                    'voice_id' => 'mock_voice_' . $voiceClone->id . '_' . time(),
                    'cloned_at' => now()
                ]);
                
                Log::info('Voice clone completed successfully (simulated)', [
                    'voice_clone_id' => $voiceClone->id,
                    'voice_id' => $voiceClone->voice_id
                ]);
                return;
            }
            
            // Real API call
            // Get file path based on storage disk
            if ($this->fileStorageDisk === 's3') {
                // For S3, we need to download the file to a temporary location
                $tempFilePath = storage_path('app/temp/' . basename($filePath));
                
                // Ensure temp directory exists
                if (!file_exists(dirname($tempFilePath))) {
                    mkdir(dirname($tempFilePath), 0755, true);
                }
                
                // Download file from S3 to temp location
                $fileContent = Storage::disk('s3')->get($filePath);
                file_put_contents($tempFilePath, $fileContent);
                $fullFilePath = $tempFilePath;
                
                Log::info('File downloaded from S3 to temp location', [
                    's3_path' => $filePath,
                    'temp_path' => $tempFilePath
                ]);
            } else {
                // For local storage, use the existing path
                $fullFilePath = Storage::disk('public')->path($filePath);
            }
            
            Log::info('Making API call to voice clone service', [
                'voice_clone_id' => $voiceClone->id,
                'api_url' => $this->minimaxApiUrl,
                'voice_name' => $voiceClone->voice_name,
                'preview_text' => $voiceClone->preview_text,
                'language_tag' => $voiceClone->language_tag,
                'gender_tag' => $voiceClone->gender_tag,
                'need_noise_reduction' => $voiceClone->need_noise_reduction
            ]);
            
            // Build multipart form data with all required fields
            $response = Http::withHeaders([
                'xi-api-key' => $this->minimaxApiKey,
                'Accept' => 'application/json',
            ])
            ->timeout(120)
            ->attach('file', file_get_contents($fullFilePath), basename($filePath))
            ->post($this->minimaxApiUrl, [
                'voice_name' => $voiceClone->voice_name,
                'preview_text' => $voiceClone->preview_text,
                'language_tag' => $voiceClone->language_tag,
                'gender_tag' => $voiceClone->gender_tag,
                'need_noise_reduction' => $voiceClone->need_noise_reduction ? 'true' : 'false'
            ]);
            
            Log::info('API response received', [
                'voice_clone_id' => $voiceClone->id,
                'status' => $response->status(),
                'response_body' => $response->body()
            ]);
            
             if ($response->successful()) {
                 $responseData = $response->json();
                 
                 if (isset($responseData['success']) && $responseData['success'] === true && isset($responseData['clone_voice_id'])) {
                     $voiceClone->update([
                         'status' => 'completed',
                         'voice_id' => $responseData['clone_voice_id'],
                         'cloned_at' => now()
                     ]);
                     
                     Log::info('Voice clone completed successfully', [
                         'voice_clone_id' => $voiceClone->id,
                         'voice_id' => $responseData['clone_voice_id']
                     ]);
                 } else {
                     throw new \Exception('API response indicates failure: ' . json_encode($responseData));
                 }
             } else {
                 throw new \Exception('API request failed with status: ' . $response->status() . ' - ' . $response->body());
             }
             
             // Clean up temporary file if it was created
             if (isset($tempFilePath) && file_exists($tempFilePath)) {
                 unlink($tempFilePath);
                 Log::info('Temporary file cleaned up', ['temp_path' => $tempFilePath]);
             }
             
         } catch (\Exception $e) {
             Log::error('Error processing voice clone with Minimax API: ' . $e->getMessage());
             
             // Clean up temporary file if it was created (even on error)
             if (isset($tempFilePath) && file_exists($tempFilePath)) {
                 unlink($tempFilePath);
                 Log::info('Temporary file cleaned up after error', ['temp_path' => $tempFilePath]);
             }
             
             // Update status to failed
             $voiceClone->update([
                 'status' => 'failed',
                 'updated_at' => now()
             ]);
         }
    }
    
    /**
     * Get audio file information
     */
    private function getAudioInfo($file): array
    {
        $duration = 0;
        
        try {
            // Use getID3 to get accurate audio information
            $getID3 = new getID3();
            $fileInfo = $getID3->analyze($file->getRealPath());
            
            if (isset($fileInfo['playtime_seconds'])) {
                $duration = (float) $fileInfo['playtime_seconds'];
            }
            
        } catch (\Exception $e) {
            Log::warning('Could not get audio duration with getID3: ' . $e->getMessage());
            
            // Fallback to basic file size estimation
            try {
                $fileSize = $file->getSize();
                // Assuming 128kbps MP3: 128kbps = 16KB/s
                $estimatedDuration = ($fileSize / 16);
                $duration = min($estimatedDuration, 300); // Cap at 5 minutes
            } catch (\Exception $fallbackException) {
                Log::warning('Fallback duration calculation also failed: ' . $fallbackException->getMessage());
            }
        }
        
        return [
            'duration' => $duration,
            'size' => $file->getSize(),
            'type' => $file->getMimeType()
        ];
    }
    
    /**
     * Get single voice clone
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $voiceClone = VoiceClone::where('user_id', $user->id)
                ->where('id', $id)
                ->first();
            
            if (!$voiceClone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voice clone not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $voiceClone
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching voice clone: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching voice clone'
            ], 500);
        }
    }
    
    /**
     * Delete voice clone
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $voiceClone = VoiceClone::where('user_id', $user->id)
                ->where('id', $id)
                ->first();
            
            if (!$voiceClone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voice clone not found'
                ], 404);
            }
            
            // If voice clone has a voice_id from Minimax API, delete it from the service
            if ($voiceClone->voice_id && $this->minimaxApiKey !== 'your_minimax_api_key_here') {
                try {
                    Log::info('Attempting to delete voice clone from Minimax API', [
                        'voice_clone_id' => $voiceClone->id,
                        'voice_id' => $voiceClone->voice_id
                    ]);
                    
                    $deleteResponse = Http::withHeaders([
                        'xi-api-key' => $this->minimaxApiKey,
                        'Accept' => 'application/json',
                    ])->timeout(30)->delete("{$this->minimaxApiUrl}/{$voiceClone->voice_id}");
                    
                    Log::info('Minimax API delete response', [
                        'voice_clone_id' => $voiceClone->id,
                        'voice_id' => $voiceClone->voice_id,
                        'status' => $deleteResponse->status(),
                        'response_body' => $deleteResponse->body()
                    ]);
                    
                    if (!$deleteResponse->successful()) {
                        Log::warning('Failed to delete voice from Minimax API, but continuing with local deletion', [
                            'voice_clone_id' => $voiceClone->id,
                            'voice_id' => $voiceClone->voice_id,
                            'status' => $deleteResponse->status(),
                            'response' => $deleteResponse->body()
                        ]);
                    }
                } catch (\Exception $apiException) {
                    Log::error('Error calling Minimax API delete endpoint: ' . $apiException->getMessage(), [
                        'voice_clone_id' => $voiceClone->id,
                        'voice_id' => $voiceClone->voice_id
                    ]);
                    // Continue with local deletion even if API call fails
                }
            }
            
            // Delete associated file
            if ($voiceClone->file_path) {
                // Use the same storage disk that was used for upload
                Storage::disk($this->fileStorageDisk)->delete($voiceClone->file_path);
                Log::info('File deleted from storage', [
                    'file_path' => $voiceClone->file_path,
                    'storage_disk' => $this->fileStorageDisk
                ]);
            }
            
            // Delete record
            $voiceClone->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Voice clone deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting voice clone: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting voice clone'
            ], 500);
        }
    }
}
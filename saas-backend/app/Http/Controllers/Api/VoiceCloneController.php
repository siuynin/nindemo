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
    
    public function __construct()
    {
        $this->minimaxApiKey = env('MINIMAX_API_KEY');
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
                'need_noise_reduction' => 'required|boolean',
                'platform' => 'required|string|in:minimax,elevenlabs',
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
            $userCredit = UserCredit::where('user_id', $user->id)->first();
            
            if (!$userCredit || $userCredit->credits < $creditCost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient credits. Voice clone requires ' . $creditCost . ' credits.'
                ], 402);
            }
            
            // Handle file upload
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('voice_clones/' . $user->id, $fileName, 'public');
            
            // Validate audio duration (max 5 minutes)
            $audioInfo = $this->getAudioInfo($file);
            if ($audioInfo['duration'] > 300) { // 5 minutes
                Storage::disk('public')->delete($filePath);
                return response()->json([
                    'success' => false,
                    'message' => 'Audio duration must not exceed 5 minutes'
                ], 422);
            }
            
            // Create voice clone record
            $voiceClone = VoiceClone::create([
                'user_id' => $user->id,
                'voice_name' => $request->voice_name,
                'preview_text' => $request->preview_text,
                'language_tag' => $request->language_tag,
                'gender_tag' => $request->gender_tag,
                'need_noise_reduction' => $request->need_noise_reduction,
                'platform' => $request->platform,
                'file_path' => $filePath,
                'status' => 'pending',
                'voice_id' => null
            ]);
            
            // Deduct credits
            $userCredit->decrement('credits', $creditCost);
            
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
            
            // Get full file path
            $fullFilePath = Storage::disk('public')->path($filePath);
            
            // Prepare API request
            $response = Http::withHeaders([
                'xi-api-key' => $this->minimaxApiKey,
                'Accept' => 'application/json',
            ])
            ->timeout(120) // 2 minutes timeout
            ->attach('file', file_get_contents($fullFilePath), basename($filePath))
            ->post($this->minimaxApiUrl);
            
            if ($response->successful()) {
                $responseData = $response->json();
                
                if (isset($responseData['success']) && $responseData['success'] === true) {
                    // Update voice clone with voice_id
                    $voiceClone->update([
                        'status' => 'completed',
                        'voice_id' => $responseData['cloned_voice_id'],
                        'cloned_at' => now()
                    ]);
                    
                    Log::info('Voice clone completed successfully', [
                        'voice_clone_id' => $voiceClone->id,
                        'voice_id' => $responseData['cloned_voice_id']
                    ]);
                } else {
                    throw new \Exception('API response indicates failure: ' . json_encode($responseData));
                }
            } else {
                throw new \Exception('API request failed with status: ' . $response->status());
            }
            
        } catch (\Exception $e) {
            Log::error('Error processing voice clone with Minimax API: ' . $e->getMessage());
            
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
            
            // Delete associated file
            if ($voiceClone->file_path) {
                Storage::disk('public')->delete($voiceClone->file_path);
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
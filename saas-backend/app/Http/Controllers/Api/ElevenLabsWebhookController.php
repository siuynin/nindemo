<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ElevenLabsWebhookController extends Controller
{
    /**
     * Handle webhook from ElevenLabs when audio generation is completed
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            // Log the incoming webhook data for debugging
            Log::info('ElevenLabs webhook received', [
                'headers' => $request->headers->all(),
                'body' => $request->all()
            ]);

            // Get the task_id from the webhook
            $taskId = $request->input('id');
            $status = $request->input('status'); // done, failed, etc.
            $metadata = $request->input('metadata', []);
            $audioUrl = $metadata['audio_url'] ?? null;
            $srtUrl = $metadata['srt_url'] ?? null;
            $errorMessage = $request->input('error_message');

            if (!$taskId) {
                Log::error('ElevenLabs webhook: No task_id provided');
                return response()->json(['error' => 'No task_id provided'], 400);
            }

            // Find the generate record by task_id
            $generate = Generate::where('task_id', $taskId)->first();

            if (!$generate) {
                Log::error('ElevenLabs webhook: Generate record not found', ['task_id' => $taskId]);
                return response()->json(['error' => 'Generate record not found'], 404);
            }

            // Update the generate record based on the webhook status
            if ($status === 'done' && $audioUrl) {
                // Download and store the audio file to AWS S3
                $audioContent = file_get_contents($audioUrl);
                if ($audioContent !== false) {
                    $fileName = 'audio/' . $generate->id . '_' . time() . '.mp3';
                    
                    // Store to AWS S3
                    $s3Path = Storage::disk('s3')->put($fileName, $audioContent);
                    
                    if ($s3Path) {
                        // Get the full S3 URL
                        $s3Url = Storage::disk('s3')->url($fileName);
                        
                        $generate->update([
                            'status' => 'completed',
                            'file_patch' => $s3Url,
                            'result_url' => $s3Url,
                            'completed_at' => now()
                        ]);
                        
                        Log::info('ElevenLabs webhook: Audio saved to S3 successfully', [
                            'generate_id' => $generate->id,
                            'file_path' => $fileName,
                            's3_url' => $s3Url
                        ]);
                    } else {
                        Log::error('ElevenLabs webhook: Failed to upload to S3', ['file_name' => $fileName]);
                        $generate->update([
                            'status' => 'failed',
                            'error_message' => 'Failed to upload audio file to S3'
                        ]);
                    }
                } else {
                    Log::error('ElevenLabs webhook: Failed to download audio', ['audio_url' => $audioUrl]);
                    $generate->update([
                        'status' => 'failed',
                        'error_message' => 'Failed to download audio file'
                    ]);
                }
            } elseif ($status === 'failed') {
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $errorMessage ?: 'Audio generation failed'
                ]);
                
                Log::error('ElevenLabs webhook: Audio generation failed', [
                    'generate_id' => $generate->id,
                    'error' => $errorMessage
                ]);
            } else {
                // Handle other statuses (processing, etc.)
                $generate->update(['status' => $status]);
                
                Log::info('ElevenLabs webhook: Status updated', [
                    'generate_id' => $generate->id,
                    'status' => $status
                ]);
            }

            return response()->json(['success' => true, 'message' => 'Webhook processed successfully']);

        } catch (\Exception $e) {
            Log::error('ElevenLabs webhook error: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
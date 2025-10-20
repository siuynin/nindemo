<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RunningHubWebhookController extends Controller
{
    /**
     * Handle RunningHub webhook for video generation results
     */
    public function handleVideoWebhook(Request $request)
    {
        try {
            Log::info('RunningHub Video Webhook Received', [
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'query' => $request->query->all(),
                'url' => $request->fullUrl()
            ]);

            // Get generateId from query parameter
            $generateId = $request->query('generateId');
            if (!$generateId) {
                Log::error('RunningHub Webhook Error: Missing generateId in query parameter');
                return response()->json(['error' => 'Missing generateId parameter'], 400);
            }

            // Validate webhook payload
            $validator = Validator::make($request->all(), [
                'code' => 'required|integer',
                'msg' => 'nullable|string',
                'data' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                Log::error('RunningHub Webhook Validation Failed', [
                    'errors' => $validator->errors(),
                    'payload' => $request->all()
                ]);
                return response()->json(['error' => 'Invalid webhook payload'], 400);
            }

            $code = $request->input('code');
            $msg = $request->input('msg', '');
            $data = $request->input('data', []);

            // Find the Generate record by generateId
            $generate = Generate::where('id', $generateId)->first();
            if (!$generate) {
                Log::error('RunningHub Webhook Error: Generate record not found', [
                    'generateId' => $generateId
                ]);
                return response()->json(['error' => 'Generate record not found'], 404);
            }

            // Update the taskId if we have it in the data
            if (isset($data[0]['taskId'])) {
                $generate->task_id = $data[0]['taskId'];
            }

            if ($code === 0) {
                // Success - video generation completed
                Log::info('RunningHub Video Generation Completed', [
                    'generateId' => $generateId,
                    'data' => $data
                ]);

                // Extract video URL from data array
                $videoUrl = null;
                if (isset($data[0]['fileUrl'])) {
                    $videoUrl = $data[0]['fileUrl'];
                }

                if ($videoUrl) {
                    // Update Generate record with success status and video URL
                    $generate->update([
                        'status' => 'completed',
                        'result_url' => $videoUrl,
                        'completed_at' => now(),
                        'task_id' => $generate->task_id ?? (isset($data[0]['taskId']) ? $data[0]['taskId'] : null)
                    ]);

                    Log::info('Generate record updated successfully', [
                        'generateId' => $generateId,
                        'videoUrl' => $videoUrl
                    ]);
                } else {
                    Log::warning('RunningHub webhook success but no video URL found', [
                        'generateId' => $generateId,
                        'data' => $data
                    ]);
                    
                    $generate->update([
                        'status' => 'failed',
                        'error_message' => 'No video URL in webhook response',
                        'completed_at' => now()
                    ]);
                }
            } else {
                // Error - video generation failed
                Log::error('RunningHub Video Generation Failed', [
                    'generateId' => $generateId,
                    'code' => $code,
                    'msg' => $msg,
                    'data' => $data
                ]);

                $generate->update([
                    'status' => 'failed',
                    'error_message' => $msg ?: 'Unknown error from RunningHub',
                    'completed_at' => now()
                ]);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('RunningHub Webhook Processing Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Extract video URLs from RunningHub response data
     */
    private function extractVideoUrls(array $data): array
    {
        $videoUrls = [];

        if (is_array($data)) {
            foreach ($data as $item) {
                if (is_array($item) && isset($item['fileUrl'])) {
                    $fileUrl = $item['fileUrl'];
                    $fileType = $item['fileType'] ?? '';
                    
                    // Check if it's a video file
                    if (in_array(strtolower($fileType), ['mp4', 'avi', 'mov', 'webm', 'mkv']) || 
                        $this->isVideoUrl($fileUrl)) {
                        $videoUrls[] = $fileUrl;
                    }
                }
            }
        }

        return $videoUrls;
    }

    /**
     * Check if URL points to a video file based on extension
     */
    private function isVideoUrl(string $url): bool
    {
        $videoExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', '3gp'];
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
        
        return in_array($extension, $videoExtensions);
    }

    /**
     * Get webhook event details (for debugging)
     */
    public function getWebhookDetails(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'taskId' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $taskId = $request->input('taskId');

            // This would call RunningHub's getWebhookDetail API
            // Based on the documentation: https://www.runninghub.cn/runninghub-api-doc-en/api-276642713
            $response = \Illuminate\Support\Facades\Http::timeout(30)
                ->withHeaders([
                    'Host' => 'www.runninghub.ai',
                    'Content-Type' => 'application/json'
                ])
                ->post('https://www.runninghub.ai/task/openapi/getWebhookDetail', [
                    'apiKey' => config('runninghub.api_key'),
                    'taskId' => $taskId
                ]);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Failed to get webhook details',
                    'status' => $response->status()
                ], $response->status());
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            Log::error('Get Webhook Details Error', [
                'error' => $e->getMessage(),
                'taskId' => $request->input('taskId')
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }
}
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
            Log::info('RunningHub Video Webhook received', [
                'headers' => $request->headers->all(),
                'body' => $request->all()
            ]);

            // Validate webhook data
            $validator = Validator::make($request->all(), [
                'taskId' => 'required|string',
                'code' => 'required|integer',
                'msg' => 'nullable|string',
                'data' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                Log::error('RunningHub Video Webhook validation failed', [
                    'errors' => $validator->errors()->all(),
                    'request_data' => $request->all()
                ]);
                return response()->json(['error' => 'Invalid webhook data'], 400);
            }

            $taskId = $request->input('taskId');
            $code = $request->input('code');
            $message = $request->input('msg', '');
            $data = $request->input('data', []);

            // Find the generation record by task_id
            $generate = Generate::where('task_id', $taskId)->first();

            if (!$generate) {
                Log::warning('RunningHub Video Webhook: Generation not found', [
                    'taskId' => $taskId
                ]);
                return response()->json(['error' => 'Generation not found'], 404);
            }

            // Process webhook based on code
            if ($code === 0) {
                // Success - extract video URLs
                $videoUrls = $this->extractVideoUrls($data);
                
                if (!empty($videoUrls)) {
                    $generate->update([
                        'status' => 'completed',
                        'result_url' => $videoUrls[0],
                        'result_data' => json_encode([
                            'videoUrls' => $videoUrls,
                            'taskId' => $taskId,
                            'webhook_data' => $data
                        ])
                    ]);

                    Log::info('RunningHub Video Webhook: Generation completed', [
                        'taskId' => $taskId,
                        'generation_id' => $generate->id,
                        'video_urls' => $videoUrls
                    ]);
                } else {
                    Log::warning('RunningHub Video Webhook: No video URLs found in success response', [
                        'taskId' => $taskId,
                        'data' => $data
                    ]);
                    
                    $generate->update([
                        'status' => 'failed',
                        'error_message' => 'No video URLs found in response'
                    ]);
                }
            } else {
                // Error
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $message ?: 'RunningHub task failed with code: ' . $code
                ]);

                Log::error('RunningHub Video Webhook: Generation failed', [
                    'taskId' => $taskId,
                    'generation_id' => $generate->id,
                    'code' => $code,
                    'message' => $message
                ]);
            }

            return response()->json(['status' => 'success'], 200);

        } catch (\Exception $e) {
            Log::error('RunningHub Video Webhook Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
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
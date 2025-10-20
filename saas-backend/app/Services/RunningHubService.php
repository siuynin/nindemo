<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RunningHubService
{
    private string $baseUrl = 'https://www.runninghub.ai/task/openapi/ai-app/run';
    private ?string $apiKey;

    public function __construct()
    {
        // Prefer config value, fallback to env
        $this->apiKey = config('runninghub.api_key') ?? env('RUNNINGHUB_API_KEY');
    }

    /**
     * Validate request parameters for RunningHub
     */
    public function validateRequest(array $data): array
    {
        $validator = Validator::make($data, [
            'prompt' => 'required|string|max:4000',
            'width' => 'required|integer|min:64|max:4096',
            'height' => 'required|integer|min:64|max:4096',
            'role' => 'nullable|string|max:4000',
            'aspect_ratio' => 'nullable|string|max:100',
            'select' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            throw new \InvalidArgumentException($validator->errors()->first());
        }

        return $validator->validated();
    }

    /**
     * Build RunningHub request body from slug and validated data
     */
    public function buildRequest(string $slug, array $validatedData): array
    {
        $modelConfig = config('runninghub.models.' . $slug);

        if (!$modelConfig || empty($modelConfig['webapp_id'])) {
            throw new \Exception('RunningHub model config is missing for slug: ' . $slug);
        }

        $apiKey = $modelConfig['api_key'] ?? $this->apiKey;
        if (!$apiKey) {
            throw new \Exception('RunningHub API key is not configured');
        }

        $nodes = $modelConfig['nodes'] ?? [];
        $defaults = $modelConfig['defaults'] ?? [];
        $defaultRole = $modelConfig['default_role'] ?? '你是一个优秀的智能提示词助手，请帮我优化提示词';

        $roleValue = $validatedData['role'] ?? $defaultRole;

        $orderedKeys = ['prompt', 'aspect_ratio', 'select', 'height', 'width', 'role'];
        $nodeInfoList = [];

        foreach ($orderedKeys as $key) {
            if (!isset($nodes[$key])) {
                continue;
            }
            $nodeId = (string)$nodes[$key];
            $fieldValue = null;

            switch ($key) {
                case 'prompt':
                    $fieldValue = $validatedData['prompt'];
                    break;
                case 'aspect_ratio':
                    $fieldValue = $validatedData['aspect_ratio'] ?? ($defaults['aspect_ratio'] ?? null);
                    break;
                case 'select':
                    $fieldValue = $validatedData['select'] ?? ($defaults['select'] ?? null);
                    break;
                case 'width':
                case 'height':
                    $fieldValue = isset($validatedData[$key]) ? (string)$validatedData[$key] : null;
                    break;
                case 'role':
                    $fieldValue = $roleValue;
                    break;
            }

            if ($fieldValue !== null) {
                $nodeInfoList[] = [
                    'nodeId' => $nodeId,
                    'fieldName' => $key,
                    'fieldValue' => $fieldValue,
                    'description' => null,
                ];
            }
        }

        // include any other nodes present in config but not in orderedKeys
        foreach ($nodes as $key => $id) {
            if (in_array($key, $orderedKeys, true)) {
                continue;
            }
            $value = $validatedData[$key] ?? ($defaults[$key] ?? null);
            if ($value !== null) {
                $nodeInfoList[] = [
                    'nodeId' => (string)$id,
                    'fieldName' => $key,
                    'fieldValue' => $value,
                    'description' => null,
                ];
            }
        }

        return [
            'webappId' => (string)$modelConfig['webapp_id'],
            'apiKey' => (string)$apiKey,
            'nodeInfoList' => $nodeInfoList,
        ];
    }

    /**
     * Call RunningHub API to generate image (async workflow)
     */
    public function generateImage(array $request): array
    {
        try {
            // Step 1: Submit task and get taskId
            Log::info('Calling RunningHub API to create task', ['request' => $request]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Host' => 'www.runninghub.ai'
            ])->post($this->baseUrl, $request);

            if (!$response->successful()) {
                Log::error('RunningHub API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('RunningHub API request failed: ' . $response->body());
            }

            $taskData = $response->json();
            Log::info('RunningHub task created', ['response' => $taskData]);

            // Check if API call was successful
            if (isset($taskData['code']) && $taskData['code'] !== 0) {
                $errorMsg = $taskData['msg'] ?? 'Unknown error';
                throw new \Exception("RunningHub API error (code {$taskData['code']}): {$errorMsg}");
            }

            if (!isset($taskData['data']) || !is_array($taskData['data']) || !isset($taskData['data']['taskId'])) {
                throw new \Exception('No taskId returned from RunningHub API');
            }

            $taskId = $taskData['data']['taskId'];
            $apiKey = $request['apiKey'];

            // Step 2: Poll for results
            return $this->pollTaskResult($apiKey, $taskId);

        } catch (\Exception $e) {
            Log::error('RunningHub API exception', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Poll RunningHub task result until completion
     */
    private function pollTaskResult(string $apiKey, string $taskId, int $maxAttempts = 30, int $delaySeconds = 3): array
    {
        $pollUrl = 'https://www.runninghub.ai/task/openapi/outputs';
        
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                Log::info("Polling RunningHub result (attempt {$attempt})", ['taskId' => $taskId]);

                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Host' => 'www.runninghub.ai'
                ])->post($pollUrl, [
                    'apiKey' => $apiKey,
                    'taskId' => $taskId
                ]);

                if (!$response->successful()) {
                    Log::warning('RunningHub polling failed', [
                        'attempt' => $attempt,
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                    
                    if ($attempt === $maxAttempts) {
                        throw new \Exception('RunningHub polling failed after max attempts: ' . $response->body());
                    }
                    
                    sleep($delaySeconds);
                    continue;
                }

                $resultData = $response->json();
                Log::info('RunningHub polling response', ['attempt' => $attempt, 'response' => $resultData]);

                // Check if we have results with fileUrl
                if (isset($resultData['data']) && is_array($resultData['data']) && !empty($resultData['data'])) {
                    // Check if data contains fileUrl (actual completion)
                    $hasFileUrl = false;
                    foreach ($resultData['data'] as $item) {
                        if (isset($item['fileUrl'])) {
                            $hasFileUrl = true;
                            break;
                        }
                    }
                    
                    if ($hasFileUrl) {
                        // Found results with fileUrl - task actually completed
                        Log::info('RunningHub task completed', ['taskId' => $taskId, 'results_count' => count($resultData['data'])]);
                        Log::info('RunningHub complete response structure', ['response' => $resultData]);
                        return $resultData;
                    }
                }

                // Task still running, continue polling
                if ($attempt < $maxAttempts) {
                    Log::info("Task still running, waiting {$delaySeconds}s before next poll", ['taskId' => $taskId]);
                    sleep($delaySeconds);
                }

            } catch (\Exception $e) {
                Log::error('RunningHub polling exception', [
                    'attempt' => $attempt,
                    'taskId' => $taskId,
                    'error' => $e->getMessage()
                ]);
                
                if ($attempt === $maxAttempts) {
                    throw $e;
                }
                
                sleep($delaySeconds);
            }
        }

        throw new \Exception("Image generation task timeout after {$maxAttempts} attempts");
    }

    /**
     * Extract image URLs from RunningHub response. Tries multiple structures.
     */
    public function extractImageUrls(array $response): array
    {
        $urls = [];

        // Handle new RunningHub response format with fileUrl in data array
        if (isset($response['data']) && is_array($response['data'])) {
            foreach ($response['data'] as $item) {
                if (isset($item['fileUrl']) && is_string($item['fileUrl'])) {
                    // Trim whitespace from URL
                    $cleanUrl = trim($item['fileUrl']);
                    if (!empty($cleanUrl) && $this->looksLikeImageUrl($cleanUrl)) {
                        $urls[] = $cleanUrl;
                    }
                }
            }
        }

        // Fallback: Try legacy formats
        if (empty($urls)) {
            // Try common fields
            $candidates = [
                // response['data']['imageURL'] / ['resultUrl']
                data_get($response, 'data.imageURL'),
                data_get($response, 'data.resultUrl'),
                data_get($response, 'imageURL'),
                data_get($response, 'resultUrl'),
            ];
            foreach ($candidates as $c) {
                if (is_string($c) && $this->looksLikeImageUrl($c)) {
                    $urls[] = $c;
                }
            }

            // result list arrays
            $lists = [
                data_get($response, 'data.resultList', []),
                data_get($response, 'resultList', []),
                data_get($response, 'data.results', []),
            ];
            foreach ($lists as $list) {
                if (is_array($list)) {
                    foreach ($list as $item) {
                        $possible = [
                            data_get($item, 'imageURL'),
                            data_get($item, 'url'),
                            data_get($item, 'outputUrl'),
                            data_get($item, 'resultUrl'),
                            data_get($item, 'fileUrl'), // Add fileUrl to legacy check
                        ];
                        foreach ($possible as $p) {
                            if (is_string($p) && $this->looksLikeImageUrl($p)) {
                                $urls[] = $p;
                            }
                        }
                    }
                }
            }
        }

        // Last resort: scan strings for http links
        if (empty($urls)) {
            $json = json_encode($response);
            if ($json) {
                preg_match_all('/https?:\\/\\/[^"]+\.(?:png|jpg|jpeg|webp)/i', $json, $matches);
                if (!empty($matches[0])) {
                    $urls = array_values(array_unique($matches[0]));
                }
            }
        }

        return array_values(array_unique($urls));
    }

    private function looksLikeImageUrl(string $url): bool
    {
        return (bool)preg_match('/\.(png|jpg|jpeg|webp)(\?.*)?$/i', $url);
    }

    /**
     * Generate video using RunningHub API with webhook support
     * Supports both text-to-video and image-to-video
     */
    public function generateVideo(array $data, ?string $generateId = null): array
    {
        try {
            if (!$this->apiKey) {
                throw new \Exception('RunningHub API key is not configured');
            }

            // Determine video type and webapp ID
            $isImageToVideo = !empty($data['inputImage']);
            $webappId = $isImageToVideo ? '1973555366057390081' : '1973555977595301890';

            // Build node info list based on video type
            $nodeInfoList = [];

            if ($isImageToVideo) {
                // Image-to-video nodes
                $nodeInfoList[] = [
                    'nodeId' => '2',
                    'fieldName' => 'image',
                    'fieldValue' => $data['inputImage'],
                    'description' => 'Upload image (input of real human images is not supported)'
                ];

                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'model',
                    'fieldData' => '[{"name":"portrait","index":"portrait","description":"竖屏","fastIndex":1.0,"descriptionEn":"Vertical screen"},{"name":"landscape","index":"landscape","description":"横屏","fastIndex":2.0,"descriptionEn":"Landscape mode"},{"name":"portrait-hd","index":"portrait-hd","description":"高清竖屏","fastIndex":3.0,"descriptionEn":"High-definition vertical screen"},{"name":"landscape-hd","index":"landscape-hd","description":"高清横屏","fastIndex":4.0,"descriptionEn":"HD horizontal screen"}]',
                    'fieldValue' => $data['model'] ?? 'landscape',
                    'description' => 'Horizontal and vertical mode'
                ];

                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'duration_seconds',
                    'fieldData' => '[[10, 15], {"default": 10}]',
                    'fieldValue' => (string)($data['duration'] ?? 10),
                    'description' => 'Duration (seconds)'
                ];

                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'prompt',
                    'fieldValue' => $data['positivePrompt'] ?? $data['prompt'],
                    'description' => 'Input text'
                ];
            } else {
                // Text-to-video nodes
                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'prompt',
                    'fieldValue' => $data['positivePrompt'] ?? $data['prompt'],
                    'description' => 'Input text'
                ];

                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'model',
                    'fieldData' => '[{"name":"portrait","index":"portrait","description":"竖屏","fastIndex":1.0,"descriptionEn":"Vertical screen"},{"name":"landscape","index":"landscape","description":"横屏","fastIndex":2.0,"descriptionEn":"Horizontal screen"},{"name":"portrait-hd","index":"portrait-hd","description":"高清竖屏","fastIndex":3.0,"descriptionEn":"HD vertical screen"},{"name":"landscape-hd","index":"landscape-hd","description":"高清横屏","fastIndex":4.0,"descriptionEn":"HD horizontal screen"}]',
                    'fieldValue' => $data['model'] ?? 'portrait',
                    'description' => 'Horizontal and vertical mode'
                ];

                $nodeInfoList[] = [
                    'nodeId' => '1',
                    'fieldName' => 'duration_seconds',
                    'fieldData' => '[[10, 15], {"default": 10}]',
                    'fieldValue' => (string)($data['duration'] ?? 10),
                    'description' => 'Duration (seconds)'
                ];
            }

            // Build webhook URL with generateId as identifier (we'll map this to taskId later)
            $webhookUrl = config('app.url') . '/api/runninghub/video-webhook';
            if ($generateId) {
                $webhookUrl .= '?generateId=' . $generateId;
            }
            
            $requestData = [
                'webappId' => $webappId,
                'apiKey' => $this->apiKey,
                'nodeInfoList' => $nodeInfoList,
                'webhookUrl' => $webhookUrl
            ];

            Log::info('RunningHub Video API Request with Webhook', [
                'request' => $requestData,
                'webhook_url' => $webhookUrl
            ]);

            // Make API call
            $response = Http::withHeaders([
                'Host' => 'www.runninghub.ai',
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, $requestData);

            if (!$response->successful()) {
                Log::error('RunningHub Video API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('RunningHub Video API request failed: ' . $response->body());
            }

            $responseData = $response->json();
            Log::info('RunningHub Video API Response', ['response' => $responseData]);

            // Check for API errors
            if (isset($responseData['code']) && $responseData['code'] !== 0) {
                throw new \Exception('RunningHub Video API error: ' . ($responseData['msg'] ?? 'Unknown error'));
            }

            // Extract task ID
            $taskId = $responseData['data']['taskId'] ?? null;
            if (!$taskId) {
                throw new \Exception('No task ID returned from RunningHub Video API');
            }

            // Return task ID immediately - webhook will handle completion
            return [
                'success' => true,
                'taskId' => $taskId,
                'status' => 'processing',
                'message' => 'Video generation started. Results will be delivered via webhook.',
                'webhook_url' => $webhookUrl
            ];

        } catch (\Exception $e) {
            Log::error('RunningHub Video Generation Error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Poll RunningHub video task result
     */
    private function pollVideoTaskResult(string $taskId, int $maxAttempts = 30, int $delaySeconds = 3): array
    {
        $pollUrl = 'https://www.runninghub.ai/task/openapi/outputs';
        
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                Log::info("Polling RunningHub video task (attempt {$attempt}/{$maxAttempts})", ['taskId' => $taskId]);

                $response = Http::timeout(30)->withHeaders([
                    'Host' => 'www.runninghub.ai',
                    'Content-Type' => 'application/json',
                ])->post($pollUrl, [
                    'taskId' => $taskId,
                    'apiKey' => $this->apiKey
                ]);

                if (!$response->successful()) {
                    Log::warning('RunningHub video polling failed', [
                        'attempt' => $attempt,
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                    
                    if ($attempt === $maxAttempts) {
                        throw new \Exception('RunningHub video polling failed after ' . $maxAttempts . ' attempts');
                    }
                    
                    sleep($delaySeconds);
                    continue;
                }

                $data = $response->json();
                Log::info('RunningHub video polling response', ['response' => $data]);

                // Check if task is completed
                if (isset($data['code']) && $data['code'] === 0 && isset($data['data'])) {
                    // Look for video URL in the response
                    $videoUrls = $this->extractVideoUrls($data);
                    
                    if (!empty($videoUrls)) {
                        return [
                            'success' => true,
                            'videoUrl' => $videoUrls[0],
                            'videoUrls' => $videoUrls,
                            'taskId' => $taskId,
                            'response' => $data
                        ];
                    }
                }

                // Check for errors
                if (isset($data['code']) && $data['code'] !== 0 && $data['code'] !== 804) {
                    throw new \Exception('RunningHub video task failed: ' . ($data['msg'] ?? 'Unknown error'));
                }

                // Task still running, continue polling
                if ($attempt < $maxAttempts) {
                    sleep($delaySeconds);
                }

            } catch (\Exception $e) {
                if ($attempt === $maxAttempts) {
                    throw $e;
                }
                Log::warning('RunningHub video polling exception', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage()
                ]);
                sleep($delaySeconds);
            }
        }

        throw new \Exception('RunningHub video task timeout after ' . ($maxAttempts * $delaySeconds) . ' seconds');
    }

    /**
     * Extract video URLs from RunningHub response
     */
    private function extractVideoUrls(array $response): array
    {
        $urls = [];

        // Check for fileUrl in data array (new format)
        if (isset($response['data']) && is_array($response['data'])) {
            foreach ($response['data'] as $item) {
                if (isset($item['fileUrl'])) {
                    $fileUrl = trim($item['fileUrl']);
                    if ($this->looksLikeVideoUrl($fileUrl)) {
                        $urls[] = $fileUrl;
                    }
                }
            }
        }

        // Fallback: scan for video URLs in the response
        if (empty($urls)) {
            $json = json_encode($response);
            if ($json) {
                preg_match_all('/https?:\\/\\/[^"]+\.(?:mp4|avi|mov|wmv|flv|webm)/i', $json, $matches);
                if (!empty($matches[0])) {
                    $urls = array_values(array_unique($matches[0]));
                }
            }
        }

        return array_values(array_unique($urls));
    }

    /**
     * Check if URL looks like a video URL
     */
    private function looksLikeVideoUrl(string $url): bool
    {
        return (bool)preg_match('/\.(mp4|avi|mov|wmv|flv|webm)(\?.*)?$/i', $url);
    }
}
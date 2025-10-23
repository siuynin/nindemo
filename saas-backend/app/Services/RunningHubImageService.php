<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class RunningHubImageService
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $webappId;
    protected ImageStorageService $imageStorageService;

    public function __construct(ImageStorageService $imageStorageService)
    {
        $this->apiKey = config('services.runninghub.api_key') ?? '';
        $this->baseUrl = config('services.runninghub.base_url', 'https://www.runninghub.ai');
        $this->webappId = config('services.runninghub.webapp_id') ?? '';
        $this->imageStorageService = $imageStorageService;
    }

    /**
     * Get API Key
     */
    public function getApiKey(): string
    {
        return $this->apiKey;
    }

    /**
     * Get WebApp ID
     */
    public function getWebAppId(): string
    {
        return $this->webappId;
    }

    /**
     * Get Base URL
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Generate image-to-image using ImageGen
     */
    public function generateImageToImage(string $prompt, string $image, string $ratio): array
    {
        try {
            // Upload image to S3 first if it's not already an S3 URL
            $imageUrl = $image;
            if (!str_contains($image, 's3.amazonaws.com') && !str_contains($image, 'amazonaws.com')) {
                Log::info('Uploading image to S3 before sending to RunningHub', ['original_image' => $image]);
                $imageUrl = $this->imageStorageService->uploadImageFromUrl($image, 'runninghub-images');
                Log::info('Image uploaded to S3 successfully', ['s3_url' => $imageUrl]);
            }

            $requestData = [
                'webappId' => $this->webappId ?? '1960555138882691073',
                'apiKey' => $this->apiKey,
                'nodeInfoList' => [
                    [
                        'nodeId' => '2',
                        'fieldName' => 'image',
                        'fieldValue' => $imageUrl,
                        'description' => 'Upload image 1'
                    ],
                    [
                        'nodeId' => '16',
                        'fieldName' => 'prompt',
                        'fieldValue' => $prompt,
                        'description' => 'Input text'
                    ],
                    [
                        'nodeId' => '1',
                        'fieldName' => 'aspectRatio',
                        'fieldData' => '[[\"auto\", \"1:1\", \"2:3\", \"3:2\", \"3:4\", \"4:3\", \"4:5\", \"5:4\", \"9:16\", \"16:9\", \"21:9\"], {\"default\": \"auto\"}]',
                        'fieldValue' => $ratio,
                        'description' => null
                    ]
                ]
            ];

            Log::info('Calling RunningHub image-to-image API', [
                'webappId' => $this->webappId,
                'ratio' => $ratio,
                'prompt_length' => strlen($prompt),
                'image_url' => $imageUrl
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Host' => 'www.runninghub.ai'
            ])->timeout(60)->post("{$this->baseUrl}/task/openapi/ai-app/run", $requestData);

            if (!$response->successful()) {
                Log::error('ImageGen error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'prompt' => substr($prompt, 0, 100) . '...'
                ]);
                throw new Exception("ImageGen request failed: " . $response->body());
            }

            $taskData = $response->json();
            Log::info('RunningHub task created', ['response' => $taskData]);

            // Check if API call was successful
            if (isset($taskData['code']) && $taskData['code'] !== 0) {
                $errorMsg = $taskData['msg'] ?? 'Unknown error';
                throw new Exception("ImageGen error (code {$taskData['code']}): {$errorMsg}");
            }

            if (!isset($taskData['data']) || !is_array($taskData['data']) || !isset($taskData['data']['taskId'])) {
                throw new Exception('No taskId returned from ImageGen');
            }

            $taskId = $taskData['data']['taskId'];

            // Poll for results with timeout handling
            $result = $this->pollTaskResult($taskId);

            // Check if result indicates timeout (processing status)
            if (isset($result['status']) && $result['status'] === 'processing') {
                return [
                    'success' => true,
                    'status' => 'processing',
                    'task_id' => $taskId,
                    'message' => 'Task is still processing. Use the check endpoint to get updates.',
                    'raw_response' => $taskData
                ];
            }

            if (isset($result['images']) && !empty($result['images'])) {
                return [
                    'success' => true,
                    'status' => 'completed',
                    'task_id' => $taskId,
                    'images' => $result['images'],
                    'raw_response' => $taskData
                ];
            } else {
                throw new Exception('No images generated from ImageGen');
            }

        } catch (Exception $e) {
            Log::error('RunningHub image-to-image generation failed', [
                'error' => $e->getMessage(),
                'prompt' => substr($prompt, 0, 100) . '...'
            ]);
            throw $e;
        }
    }

    /**
     * Poll RunningHub task for results
     */
    private function pollTaskResult(string $taskId, int $maxAttempts = 10, int $delaySeconds = 3): array
    {
        $pollUrl = "{$this->baseUrl}/task/openapi/outputs";
        
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                Log::info("Polling RunningHub result (attempt {$attempt})", ['taskId' => $taskId]);

                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Host' => 'www.runninghub.ai'
                ])->timeout(60)->post($pollUrl, [
                    'apiKey' => $this->apiKey,
                    'taskId' => $taskId
                ]);

                if (!$response->successful()) {
                    Log::warning('RunningHub polling failed', [
                        'attempt' => $attempt,
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                    
                    if ($attempt === $maxAttempts) {
                        // Return processing status instead of throwing exception
                        Log::info('Max polling attempts reached, returning processing status', ['taskId' => $taskId]);
                        return ['status' => 'processing', 'task_id' => $taskId];
                    }
                    
                    sleep($delaySeconds);
                    continue;
                }

                $resultData = $response->json();
                Log::info('RunningHub polling response', ['data' => $resultData]);

                // Check if task is completed
                if (isset($resultData['code']) && $resultData['code'] === 0) {
                    if (isset($resultData['data']) && is_array($resultData['data'])) {
                        $images = [];
                        foreach ($resultData['data'] as $output) {
                            if (isset($output['imageUrl'])) {
                                $images[] = [
                                    'url' => $output['imageUrl'],
                                    'seed' => null
                                ];
                            }
                        }
                        
                        if (!empty($images)) {
                            return ['images' => $images, 'status' => 'completed'];
                        }
                    }
                }

                if ($attempt === $maxAttempts) {
                    // Return processing status instead of throwing exception
                    Log::info('Task not completed after maximum attempts, returning processing status', ['taskId' => $taskId]);
                    return ['status' => 'processing', 'task_id' => $taskId];
                }

                sleep($delaySeconds);

            } catch (Exception $e) {
                Log::error('Error polling RunningHub task', ['error' => $e->getMessage()]);
                
                if ($attempt === $maxAttempts) {
                    // Return processing status instead of throwing exception
                    Log::info('Polling failed after maximum attempts, returning processing status', ['taskId' => $taskId]);
                    return ['status' => 'processing', 'task_id' => $taskId];
                }
                
                sleep($delaySeconds);
            }
        }

        // This should not be reached, but return processing status as fallback
        return ['status' => 'processing', 'task_id' => $taskId];
    }

    /**
     * Check task status and get results (for frontend polling)
     */
    public function checkTaskStatus(string $taskId): array
    {
        try {
            Log::info('Checking RunningHub task status', ['taskId' => $taskId]);

            $pollUrl = "{$this->baseUrl}/task/openapi/outputs";
            
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Host' => 'www.runninghub.ai'
            ])->timeout(60)->post($pollUrl, [
                'apiKey' => $this->apiKey,
                'taskId' => $taskId
            ]);

            if (!$response->successful()) {
                Log::warning('RunningHub task status check failed', [
                    'taskId' => $taskId,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return [
                    'success' => false,
                    'status' => 'error',
                    'message' => 'Failed to check task status',
                    'task_id' => $taskId
                ];
            }

            $resultData = $response->json();
            Log::info('RunningHub task status response', ['data' => $resultData]);

            // Check if task is completed
            if (isset($resultData['code']) && $resultData['code'] === 0) {
                if (isset($resultData['data']) && is_array($resultData['data'])) {
                    $images = [];
                    $s3Images = [];
                    
                    foreach ($resultData['data'] as $output) {
                        if (isset($output['imageUrl'])) {
                            $originalUrl = $output['imageUrl'];
                            $images[] = [
                                'url' => $originalUrl,
                                'seed' => null
                            ];
                            
                            // Upload to S3 and get S3 URL
                            try {
                                $s3Url = $this->imageStorageService->uploadImageFromUrl($originalUrl, 'runninghub-results');
                                $s3Images[] = [
                                    'url' => $s3Url,
                                    'original_url' => $originalUrl,
                                    'seed' => null
                                ];
                                Log::info('Image uploaded to S3', ['original' => $originalUrl, 's3_url' => $s3Url]);
                            } catch (Exception $e) {
                                Log::error('Failed to upload image to S3', [
                                    'original_url' => $originalUrl,
                                    'error' => $e->getMessage()
                                ]);
                                // Still include original URL if S3 upload fails
                                $s3Images[] = [
                                    'url' => $originalUrl,
                                    'original_url' => $originalUrl,
                                    'seed' => null,
                                    's3_upload_error' => $e->getMessage()
                                ];
                            }
                        }
                    }
                    
                    if (!empty($images)) {
                        return [
                            'success' => true,
                            'status' => 'completed',
                            'task_id' => $taskId,
                            'images' => $s3Images, // Return S3 URLs
                            'original_images' => $images // Keep original URLs for reference
                        ];
                    }
                }
            }

            // Task is still processing
            return [
                'success' => true,
                'status' => 'processing',
                'task_id' => $taskId,
                'message' => 'Task is still processing'
            ];

        } catch (Exception $e) {
            Log::error('Error checking RunningHub task status', [
                'taskId' => $taskId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'status' => 'error',
                'task_id' => $taskId,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get service configuration
     */
    public function getConfig(): array
    {
        return [
            'api_key' => $this->apiKey ? '***' . substr($this->apiKey, -4) : 'not_set',
            'base_url' => $this->baseUrl,
            'webapp_id' => $this->webappId ? '***' . substr($this->webappId, -4) : 'not_set'
        ];
    }

    /**
     * Check if service is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->webappId);
    }
}
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
        $this->apiKey = config('services.runninghub.api_key') ?? '4e4aed567ad742b7a9d30f97df9d2298';
        $this->baseUrl = config('services.runninghub.base_url', 'https://www.runninghub.ai');
        $this->webappId = config('services.runninghub.webapp_id') ?? '1960555138882691073';
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
            // Handle different image input formats
            $imageUrl = $image;
            
            // Check if image is base64 encoded
            if (str_starts_with($image, 'data:image/')) {
                // Base64 image - upload to S3 first, then convert back to base64 for RunningHub
                Log::info('Converting base64 image to S3 URL for RunningHub', ['image_prefix' => substr($image, 0, 50)]);
                $s3Url = $this->imageStorageService->uploadImageFromBase64($image, 'runninghub-images');
                Log::info('Base64 image uploaded to S3 successfully', ['s3_url' => $s3Url]);
                
                // Convert S3 URL back to base64 for RunningHub to avoid SSL issues
                try {
                    $imageUrl = $this->convertS3UrlToBase64($s3Url);
                    Log::info('S3 URL converted to base64 for RunningHub compatibility');
                } catch (\Exception $e) {
                    Log::warning('Failed to convert S3 URL to base64, using S3 URL directly', ['error' => $e->getMessage()]);
                    $imageUrl = $s3Url;
                }
            } elseif (str_starts_with($image, 'http')) {
                // HTTP URL - convert to base64 to avoid RunningHub SSL connection issues
                if (str_contains($image, 's3.amazonaws.com') || str_contains($image, 'amazonaws.com')) {
                    Log::info('Converting S3 URL to base64 for RunningHub compatibility', ['s3_url' => $image]);
                    try {
                        $imageUrl = $this->convertS3UrlToBase64($image);
                        Log::info('S3 URL converted to base64 successfully');
                    } catch (\Exception $e) {
                        Log::warning('Failed to convert S3 URL to base64, uploading to new S3 location', ['error' => $e->getMessage()]);
                        try {
                            $newS3Url = $this->imageStorageService->uploadImageFromUrl($image, 'runninghub-images');
                            $imageUrl = $this->convertS3UrlToBase64($newS3Url);
                            Log::info('Image re-uploaded to S3 and converted to base64', ['new_s3_url' => $newS3Url]);
                        } catch (\Exception $e2) {
                            Log::error('All fallback methods failed, using original URL', ['error' => $e2->getMessage()]);
                            $imageUrl = $image;
                        }
                    }
                } else {
                    // Non-S3 HTTP URL - upload to S3 first, then convert to base64
                    Log::info('Uploading HTTP image to S3 before sending to RunningHub', ['original_image' => $image]);
                    try {
                        $s3Url = $this->imageStorageService->uploadImageFromUrl($image, 'runninghub-images');
                        Log::info('HTTP image uploaded to S3 successfully', ['s3_url' => $s3Url]);
                        $imageUrl = $this->convertS3UrlToBase64($s3Url);
                        Log::info('S3 URL converted to base64 for RunningHub');
                    } catch (\Exception $e) {
                        Log::warning('Failed to upload to S3 or convert to base64, using original URL', ['error' => $e->getMessage(), 'original_url' => $image]);
                        $imageUrl = $image; // Fallback to original URL
                    }
                }
            } else {
                // Assume it's a direct URL or path
                Log::info('Using image URL directly', ['image_url' => $image]);
                $imageUrl = $image;
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

            // Use the correct API endpoint for checking task outputs
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
            Log::info('RunningHub task status response', ['taskId' => $taskId, 'data' => $resultData]);

            // Check response format according to RunningHub API documentation
            if (isset($resultData['code']) && $resultData['code'] === 0) {
                // Success response with data
                if (isset($resultData['data']) && is_array($resultData['data']) && !empty($resultData['data'])) {
                    $images = [];
                    $s3Images = [];
                    
                    foreach ($resultData['data'] as $output) {
                        // According to API docs, the field is 'fileUrl', not 'imageUrl'
                        if (isset($output['fileUrl'])) {
                            $originalUrl = $output['fileUrl'];
                            $images[] = [
                                'url' => $originalUrl,
                                'seed' => null,
                                'fileType' => $output['fileType'] ?? 'png',
                                'taskCostTime' => $output['taskCostTime'] ?? null,
                                'nodeId' => $output['nodeId'] ?? null
                            ];
                            
                            // Upload to S3 and get S3 URL
                            try {
                                $s3Url = $this->imageStorageService->uploadImageFromUrl($originalUrl, 'runninghub-results');
                                $s3Images[] = [
                                    'url' => $s3Url,
                                    'original_url' => $originalUrl,
                                    'seed' => null,
                                    'fileType' => $output['fileType'] ?? 'png'
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
                                    'fileType' => $output['fileType'] ?? 'png',
                                    's3_upload_error' => $e->getMessage()
                                ];
                            }
                        }
                    }
                    
                    if (!empty($images)) {
                        Log::info('Task completed successfully', [
                            'taskId' => $taskId,
                            'images_count' => count($images)
                        ]);
                        
                        return [
                            'success' => true,
                            'status' => 'completed',
                            'task_id' => $taskId,
                            'images' => array_column($s3Images, 'url'), // Return just URLs for compatibility
                            'detailed_images' => $s3Images, // Return detailed info
                            'original_images' => $images // Keep original URLs for reference
                        ];
                    }
                }
                
                // If code is 0 but no data, task might still be processing
                Log::info('Task response successful but no data yet', ['taskId' => $taskId]);
                return [
                    'success' => true,
                    'status' => 'processing',
                    'task_id' => $taskId,
                    'message' => 'Task is still processing - no output data yet'
                ];
                
            } elseif (isset($resultData['code']) && $resultData['code'] !== 0) {
                // Error response from RunningHub
                $errorMsg = $resultData['msg'] ?? 'Unknown error from RunningHub';
                Log::warning('RunningHub returned error', [
                    'taskId' => $taskId,
                    'code' => $resultData['code'],
                    'message' => $errorMsg
                ]);
                
                return [
                    'success' => false,
                    'status' => 'failed',
                    'task_id' => $taskId,
                    'error' => $errorMsg,
                    'error_code' => $resultData['code']
                ];
            }

            // Unknown response format - assume still processing
            Log::warning('Unknown response format from RunningHub', [
                'taskId' => $taskId,
                'response' => $resultData
            ]);
            
            return [
                'success' => true,
                'status' => 'processing',
                'task_id' => $taskId,
                'message' => 'Task status unknown - assuming still processing'
            ];

        } catch (Exception $e) {
            Log::error('Error checking RunningHub task status', [
                'taskId' => $taskId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
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

    /**
     * Convert S3 URL to base64 format for RunningHub compatibility
     * This helps avoid SSL connection issues that RunningHub has with S3 URLs
     */
    private function convertS3UrlToBase64(string $s3Url): string
    {
        try {
            Log::info('Converting S3 URL to base64', ['s3_url' => $s3Url]);
            
            // Fetch the image from S3
            $response = Http::timeout(30)->get($s3Url);
            
            if (!$response->successful()) {
                throw new \Exception("Failed to fetch image from S3: HTTP {$response->status()}");
            }
            
            $imageData = $response->body();
            $contentType = $response->header('Content-Type');
            
            // Determine MIME type if not provided
            if (!$contentType) {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $contentType = $finfo->buffer($imageData);
            }
            
            // Convert to base64 data URL
            $base64 = base64_encode($imageData);
            $dataUrl = "data:{$contentType};base64,{$base64}";
            
            Log::info('S3 URL successfully converted to base64', [
                'original_url' => $s3Url,
                'content_type' => $contentType,
                'base64_length' => strlen($base64)
            ]);
            
            return $dataUrl;
            
        } catch (\Exception $e) {
            Log::error('Failed to convert S3 URL to base64', [
                's3_url' => $s3Url,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
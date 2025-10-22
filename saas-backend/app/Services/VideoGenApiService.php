<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VideoGenApiService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()

    {
        $this->apiKey = config('services.videogenapi.api_key');
        $this->baseUrl = 'https://videogenapi.com/api/v1/generate';
    }

    /**
     * Generate video using VideoGenAPI
     * 
     * @param array $data
     * @return array
     * @throws \Exception
     */
    public function generateVideo(array $data): array
    {
        try {
            if (!$this->apiKey) {
                throw new \Exception('VideoGenAPI key is not configured');
            }

            // Prepare request data for VideoGenAPI
            $requestData = [
                'model' => $data['model'] ?? 'portrait',
                'prompt' => $data['prompt'] ?? $data['positivePrompt'],
                'duration' => isset($data['duration']) ? (int)$data['duration'] : 10,
                'resolution' => $data['resolution'] ?? '1080p'
            ];

            // Add seed if provided
            if (!empty($data['seed'])) {
                $requestData['seed'] = (int) $data['seed'] ?? -1;
            }

            // Add audio fields if provided
            if (isset($data['add_audio']) && $data['add_audio'] === true) {
                $requestData['add_audio'] = true;
                if (!empty($data['audio_prompt'])) {
                    $requestData['audio_prompt'] = $data['audio_prompt'];
                }
            }

            // Add image_url for image-to-video generation
            if (!empty($data['image_url'])) {
                $requestData['image_url'] = $data['image_url'];
            }

            Log::info('VideoGenAPI Request', [
                'url' => $this->baseUrl,
                'request' => $requestData
            ]);

            // Make API call
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ])->post($this->baseUrl, $requestData);

            if (!$response->successful()) {
                Log::error('VideoGenAPI Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('VideoGenAPI request failed: ' . $response->body());
            }

            $responseData = $response->json();
            Log::info('VideoGenAPI Response', ['response' => $responseData]);

            // Check for API success
            if (!isset($responseData['success']) || !$responseData['success']) {
                throw new \Exception('VideoGenAPI error: ' . ($responseData['message'] ?? 'Unknown error'));
            }

            // Validate required response fields
            if (!isset($responseData['generation_id'])) {
                throw new \Exception('No generation_id returned from VideoGenAPI');
            }

            // Return standardized response
            return [
                'success' => true,
                'generation_id' => $responseData['generation_id'],
                'request_id' => $responseData['request_id'] ?? null,
                'status' => $responseData['status'] ?? 'pending',
                'message' => 'Video generation started successfully'
            ];

        } catch (\Exception $e) {
            Log::error('VideoGenAPI Service Error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Get video generation status by generation_id
     * 
     * @param string $taskId
     * @return array
     * @throws \Exception
     */
    public function getGenerationStatus(string $taskId): array
    {
        try {
            if (!$this->apiKey) {
                throw new \Exception('VideoGenAPI key is not configured');
            }

            $statusUrl = 'https://videogenapi.com/api/v1/status/' . $taskId;

            Log::info('VideoGenAPI Status Check', [
                'url' => $statusUrl,
                'task_id' => $taskId
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json'
            ])->get($statusUrl);

            if (!$response->successful()) {
                Log::error('VideoGenAPI Status Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('VideoGenAPI status request failed: ' . $response->body());
            }

            $responseData = $response->json();
            Log::info('VideoGenAPI Status Response', ['response' => $responseData]);

            return $responseData;

        } catch (\Exception $e) {
            Log::error('VideoGenAPI Status Service Error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Poll video generation status with timeout
     * 
     * @param string $taskId
     * @param int $timeoutSeconds Default 60 seconds (1 minute)
     * @param int $intervalSeconds Default 5 seconds between polls
     * @return array
     * @throws \Exception
     */
    public function pollGenerationStatus(string $taskId, int $timeoutSeconds = 60, int $intervalSeconds = 5): array
    {
        $startTime = time();
        $endTime = $startTime + $timeoutSeconds;

        Log::info('VideoGenAPI Polling Started', [
            'task_id' => $taskId,
            'timeout_seconds' => $timeoutSeconds,
            'interval_seconds' => $intervalSeconds
        ]);

        while (time() < $endTime) {
            try {
                $statusResponse = $this->getGenerationStatus($taskId);

                // Check if generation is completed
                if (isset($statusResponse['status']) && $statusResponse['status'] === 'completed') {
                    Log::info('VideoGenAPI Polling Completed', [
                        'task_id' => $taskId,
                        'elapsed_time' => time() - $startTime
                    ]);
                    return $statusResponse;
                }

                // Check if generation failed
                if (isset($statusResponse['status']) && in_array($statusResponse['status'], ['failed', 'error'])) {
                    Log::error('VideoGenAPI Generation Failed', [
                        'task_id' => $taskId,
                        'status' => $statusResponse['status'],
                        'response' => $statusResponse
                    ]);
                    return $statusResponse;
                }

                // Wait before next poll
                sleep($intervalSeconds);

            } catch (\Exception $e) {
                Log::warning('VideoGen Polling Error', [
                    'task_id' => $taskId,
                    'error' => $e->getMessage(),
                    'elapsed_time' => time() - $startTime
                ]);
                
                // Continue polling unless it's a critical error
                if (strpos($e->getMessage(), 'not configured') !== false) {
                    throw $e;
                }
                
                sleep($intervalSeconds);
            }
        }

        // Timeout reached
        Log::info('VideoGenAPI Polling Timeout', [
            'task_id' => $taskId,
            'timeout_seconds' => $timeoutSeconds
        ]);

        return [
            'success' => false,
            'status' => 'processing',
            'task_id' => $taskId,
            'message' => 'Video generation is still processing. Please check back later.',
            'timeout' => true
        ];
    }
}
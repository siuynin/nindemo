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
                'duration' => $data['duration'] ?? 10
            ];

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
     * @param string $generationId
     * @return array
     * @throws \Exception
     */
    public function getGenerationStatus(string $generationId): array
    {
        try {
            if (!$this->apiKey) {
                throw new \Exception('VideoGenAPI key is not configured');
            }

            $statusUrl = 'https://videogenapi.com/api/v1/status/' . $generationId;

            Log::info('VideoGenAPI Status Check', [
                'url' => $statusUrl,
                'generation_id' => $generationId
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
     * @param string $generationId
     * @param int $timeoutSeconds Default 60 seconds (1 minute)
     * @param int $intervalSeconds Default 5 seconds between polls
     * @return array
     * @throws \Exception
     */
    public function pollGenerationStatus(string $generationId, int $timeoutSeconds = 60, int $intervalSeconds = 5): array
    {
        $startTime = time();
        $endTime = $startTime + $timeoutSeconds;

        Log::info('VideoGenAPI Polling Started', [
            'generation_id' => $generationId,
            'timeout_seconds' => $timeoutSeconds,
            'interval_seconds' => $intervalSeconds
        ]);

        while (time() < $endTime) {
            try {
                $statusResponse = $this->getGenerationStatus($generationId);

                // Check if generation is completed
                if (isset($statusResponse['status']) && $statusResponse['status'] === 'completed') {
                    Log::info('VideoGenAPI Polling Completed', [
                        'generation_id' => $generationId,
                        'elapsed_time' => time() - $startTime
                    ]);
                    return $statusResponse;
                }

                // Check if generation failed
                if (isset($statusResponse['status']) && in_array($statusResponse['status'], ['failed', 'error'])) {
                    Log::error('VideoGenAPI Generation Failed', [
                        'generation_id' => $generationId,
                        'status' => $statusResponse['status'],
                        'response' => $statusResponse
                    ]);
                    return $statusResponse;
                }

                // Wait before next poll
                sleep($intervalSeconds);

            } catch (\Exception $e) {
                Log::warning('VideoGenAPI Polling Error', [
                    'generation_id' => $generationId,
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
            'generation_id' => $generationId,
            'timeout_seconds' => $timeoutSeconds
        ]);

        return [
            'success' => false,
            'status' => 'timeout',
            'generation_id' => $generationId,
            'message' => 'Video generation is still processing. Please check back later.',
            'timeout' => true
        ];
    }
}
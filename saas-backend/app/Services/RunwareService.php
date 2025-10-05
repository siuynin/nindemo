<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RunwareService
{
    private $apiKey;
    private $baseUrl = 'https://api.runware.ai/v1';

    public function __construct()
    {
        $this->apiKey = env('RUNWARE_API_KEY');
        
        if (!$this->apiKey) {
            throw new \Exception('Runware API key is not configured');
        }
    }

    /**
     * Generate image using Runware API
     */
    public function generateImage(array $request): array
    {
        try {
            Log::info('Calling Runware API', ['request' => $request]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [$request]);

            if (!$response->successful()) {
                Log::error('Runware API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Runware API request failed: ' . $response->body());
            }

            $data = $response->json();
            Log::info('Runware API response', ['response' => $data]);

            return $data;
        } catch (\Exception $e) {
            Log::error('Runware API exception', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Validate request parameters
     */
    public function validateRequest(array $data): array
    {
        $rules = [
            'prompt' => 'required|string|max:1000',
            'model' => 'required|string',
            'width' => 'required|integer|min:256|max:2048',
            'height' => 'required|integer|min:256|max:2048',
            'numberResults' => 'required|integer|min:1|max:4',
            'imageStyle' => 'nullable|string'
        ];

        $validator = validator($data, $rules);

        if ($validator->fails()) {
            throw new \Exception('Validation failed: ' . implode(', ', $validator->errors()->all()));
        }

        return $validator->validated();
    }

    /**
     * Upscale image using Runware API
     */
    public function upscaleImage(array $request): array
    {
        try {
            Log::info('Calling Runware Upscale API', ['request' => $request]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [$request]);

            if (!$response->successful()) {
                Log::error('Runware Upscale API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Runware Upscale API request failed: ' . $response->body());
            }

            $data = $response->json();
            Log::info('Runware Upscale API response', ['response' => $data]);

            return $data;
        } catch (\Exception $e) {
            Log::error('Runware Upscale API exception', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Build Runware upscale request
     */
    public function buildUpscaleRequest(string $inputImage, string $outputFormat, int $upscaleFactor): array
    {
        return [
            'taskType' => 'imageUpscale',
            'taskUUID' => (string) \Illuminate\Support\Str::uuid(),
            'inputImage' => $inputImage,
            'model' => 'runware:501@1',
            'outputType' => 'URL',
            'outputFormat' => $outputFormat,
            'upscaleFactor' => $upscaleFactor
        ];
    }

    /**
     * Generate video using Runware API
     */
    public function generateVideo(array $request): array
    {
        try {
            Log::info('Calling Runware Video API', ['request' => $request]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, [$request]);

            if (!$response->successful()) {
                Log::error('Runware Video API error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Runware Video API request failed: ' . $response->body());
            }

            $data = $response->json();
            Log::info('Runware Video API response', ['response' => $data]);

            return $data;
        } catch (\Exception $e) {
            Log::error('Runware Video API exception', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Build Runware request from validated data
     */
    public function buildRequest(array $validatedData): array
    {
        // Tạo prompt với imageStyle nếu có
        $finalPrompt = $validatedData['prompt'];
        if (!empty($validatedData['imageStyle'])) {
            $styleMap = [
                'realistic' => 'realistic, photorealistic, high quality',
                'anime' => 'anime style, manga style, japanese animation',
                'cinematic' => 'cinematic, movie scene, dramatic lighting',
                'abstract' => 'abstract art, artistic, creative',
                'pixel' => 'pixel art, 8-bit style, retro gaming',
                'minimal' => 'minimalist, clean, simple design'
            ];
            
            $stylePrompt = $styleMap[$validatedData['imageStyle']] ?? '';
            if ($stylePrompt) {
                $finalPrompt = $validatedData['prompt'] . ', ' . $stylePrompt;
            }
        }

        return [
            'taskType' => 'imageInference',
            'taskUUID' => (string) \Illuminate\Support\Str::uuid(),
            'positivePrompt' => $finalPrompt,
            'width' => $validatedData['width'],
            'height' => $validatedData['height'],
            'model' => $validatedData['model'],
            'numberResults' => $validatedData['numberResults']
        ];
    }
}
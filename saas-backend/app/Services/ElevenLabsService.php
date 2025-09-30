<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class ElevenLabsService
{
    private $apiKey;
    private $baseUrl = 'https://api.ai33.pro/v1';

    public function __construct()
    {
        $this->apiKey = env('ELEVENLABS_API_KEY');
    }

    /**
     * Generate speech from text using ElevenLabs API
     *
     * @param string $text
     * @param string $voiceId
     * @param string $model
     * @param array $voiceSettings
     * @return array
     */
    
    public function textToSpeech($text, $voiceId = 'pNInz6obpgDQGcFmaJgB', $model = 'eleven_v3', $voiceSettings = null)
    {
        try {
            if (!$this->apiKey) {
                throw new Exception('ElevenLabs API key not configured');
            }

            // Calculate credit cost based on model and text length
            $creditCost = $this->calculateCreditCost($text, $model);

            $requestData = [
                'text' => $text,
                'model_id' => $model,
                'with_transcript' => false,
                // 'receive_url' => config('app.url') . '/api/getaudio',
                'receive_url' => 'http://myapp.loca.lt/api/getaudio'
            ];

            // Add voice settings if provided
            if ($voiceSettings) {
                $requestData['voice_settings'] = $voiceSettings;
            }
            
            $url = $this->baseUrl . '/text-to-speech/' . $voiceId . '?output_format=mp3_44100_128';
            
            Log::info('ElevenLabs API Request', [
                'url' => $url,
                'voice_id' => $voiceId,
                'request_data' => $requestData,
                'headers' => [
                    'Accept' => 'audio/mpeg',
                    'xi-api-key' => substr($this->apiKey, 0, 10) . '...',
                    'Content-Type' => 'application/json'
                ]
            ]);
            
            $response = Http::withHeaders([
                'Accept' => 'audio/mpeg',
                'Content-Type' => 'application/json',
                'xi-api-key' => $this->apiKey,
            ])->post($url, $requestData);

            Log::info('ElevenLabs API Response', [
                'status_code' => $response->status(),
                'response_body' => $response->body(),
                'response_headers' => $response->headers()
            ]);
            
            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info('ElevenLabs API: Text-to-speech successful', [
                    'voice_id' => $voiceId,
                    'text_length' => strlen($text),
                    'response_data' => $responseData
                ]);
                
                return [
                    'success' => true,
                    'task_id' => $responseData['task_id'] ?? null,
                    'status' => $responseData['status'] ?? 'processing',
                    'credit_cost' => $creditCost
                ];
            } else {
                Log::error('ElevenLabs API: Text-to-speech failed', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->body()
                ];
            }
        } catch (Exception $e) {
            Log::error('ElevenLabs API: Exception occurred', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get available voices from ElevenLabs
     *
     * @return array
     */
    public function getVoices()
    {
        try {
            if (!$this->apiKey) {
                throw new Exception('ElevenLabs API key not configured');
            }

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'xi-api-key' => $this->apiKey,
            ])->get($this->baseUrl . '/voices');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'voices' => $response->json()['voices'] ?? []
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Failed to fetch voices: ' . $response->body()
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get user subscription info and credits
     *
     * @return array
     */
    public function getUserInfo()
    {
        try {
            if (!$this->apiKey) {
                throw new Exception('ElevenLabs API key not configured');
            }

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'xi-api-key' => $this->apiKey,
            ])->get($this->baseUrl . '/user');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'user_info' => $response->json()
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Failed to fetch user info: ' . $response->body()
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Calculate credit cost based on model and text length
     *
     * @param string $text
     * @param string $model
     * @return float
     */
    public function calculateCreditCost($text, $model)
    {
        // Get model pricing from database
        $aiModel = \App\Models\AIModel::where('slug', $model)->first();
        
        if (!$aiModel) {
            // Fallback pricing if model not found
            $modelPrices = [
                'eleven_turbo_v2_5' => 0.015,
                'eleven_v3' => 0.021
            ];
            $pricePerChar = $modelPrices[$model] ?? 0.021;
        } else {
            $pricePerChar = $aiModel->credit_price;
        }
        
        $characterCount = strlen($text);
        return $characterCount * $pricePerChar;
    }

    /**
     * Calculate estimated cost for text-to-speech
     *
     * @param string $text
     * @return float
     */
    public function calculateCost($text)
    {
        // ElevenLabs charges approximately $0.18 per 1000 characters
        $characterCount = strlen($text);
        $costPer1000Chars = 0.18;
        
        return ($characterCount / 1000) * $costPer1000Chars;
    }
}
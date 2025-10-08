<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class MinimaxService
{
    private $apiKey;
    private $baseUrl = 'https://api.ai33.pro/v1m';

    public function __construct()
    {
        $this->apiKey = env('ELEVENLABS_API_KEY');
    }

    /**
     * Generate speech from text using Minimax API
     *
     * @param string $text
     * @param string $model
     * @param array $voiceSettings
     * @param string $languageBoost
     * @param bool $withTranscript
     * @return array
     */
    public function textToSpeech($text, $model = 'speech-2.5-hd-preview', $voiceSettings = null, $languageBoost = 'Auto', $withTranscript = false)
    {
        try {
            if (!$this->apiKey) {
                throw new Exception('Minimax API key not configured');
            }

            // Calculate credit cost based on model and text length
            $creditCost = $this->calculateCreditCost($text, $model);

            // Default voice settings if not provided
            if (!$voiceSettings) {
                $voiceSettings = [
                    'voice_id' => '209533299589184',
                    'vol' => 1,
                    'pitch' => 0,
                    'speed' => 1
                ];
            }

            $requestData = [
                'text' => $text,
                'model' => $model,
                'voice_setting' => $voiceSettings,
                'language_boost' => $languageBoost,
                'with_transcript' => $withTranscript,
                'receive_url' => config('app.url') . '/api/getaudio',
            ];
            
            $url = $this->baseUrl . '/task/text-to-speech';
            
            Log::info('Minimax API Request', [
                'url' => $url,
                'request_data' => $requestData,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'xi-api-key' => substr($this->apiKey, 0, 10) . '...'
                ]
            ]);
            
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'xi-api-key' => $this->apiKey,
            ])->post($url, $requestData);

            Log::info('Minimax API Response', [
                'status_code' => $response->status(),
                'response_body' => $response->body(),
                'response_headers' => $response->headers()
            ]);
            
            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info('Minimax API: Text-to-speech successful', [
                    'model' => $model,
                    'text_length' => strlen($text),
                    'response_data' => $responseData
                ]);
                
                return [
                    'success' => true,
                    'task_id' => $responseData['task_id'] ?? null,
                    'status' => $responseData['status'] ?? 'processing',
                    'credit_cost' => $creditCost,
                    'data' => $responseData
                ];
            } else {
                Log::error('Minimax API: Text-to-speech failed', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->body()
                ];
            }
        } catch (Exception $e) {
            Log::error('Minimax API: Exception occurred', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get available models for Minimax TTS
     *
     * @return array
     */
    public function getModels()
    {
        return [
            'success' => true,
            'models' => [
                [
                    'id' => 'speech-2.5-hd-preview',
                    'name' => 'Speech 2.5 HD Preview',
                    'description' => 'High quality speech synthesis model'
                ],
                [
                    'id' => 'speech-2.0',
                    'name' => 'Speech 2.0',
                    'description' => 'Standard quality speech synthesis model'
                ]
            ]
        ];
    }
    /**
     * Get available voices from Minimax API
     */
    public function getVoices($page = 1, $pageSize = 30, $tagList = [])
    {
        try {
            $url = 'https://api.ai33.pro/v1m/voice/list';
            
            $data = [
                'page' => $page,
                'page_size' => $pageSize,
                'tag_list' => $tagList
            ];

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'xi-api-key' => $this->apiKey,
            ])->post($url, $data);

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('Minimax getVoices API response', [
                    'status' => $response->status(),
                    'data' => $result
                ]);

                return [
                    'success' => true,
                    'data' => $result['data'] ?? [],
                    'voices' => $result['data']['voice_list'] ?? []
                ];
            } else {
                Log::error('Minimax getVoices API error', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to fetch voices: ' . $response->body()
                ];
            }
        } catch (\Exception $e) {
            Log::error('Minimax getVoices exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Exception occurred: ' . $e->getMessage()
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
                'speech-2.5-hd-preview' => 0.020,
                'speech-2.0' => 0.015
            ];
            $pricePerChar = $modelPrices[$model] ?? 0.020;
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
     * @param string $model
     * @return float
     */
    public function calculateCost($text, $model = 'speech-2.5-hd-preview')
    {
        return $this->calculateCreditCost($text, $model);
    }

    /**
     * Validate voice settings for Minimax API
     *
     * @param array $voiceSettings
     * @return array
     */
    public function validateVoiceSettings($voiceSettings)
    {
        $validated = [];
        
        // Voice ID is required
        $validated['voice_id'] = $voiceSettings['voice_id'] ?? '209533299589184';
        
        // Volume (0-2)
        $validated['vol'] = isset($voiceSettings['vol']) ? 
            max(0, min(2, floatval($voiceSettings['vol']))) : 1;
        
        // Pitch (-10 to 10)
        $validated['pitch'] = isset($voiceSettings['pitch']) ? 
            max(-10, min(10, intval($voiceSettings['pitch']))) : 0;
        
        // Speed (0.5-2)
        $validated['speed'] = isset($voiceSettings['speed']) ? 
            max(0.5, min(2, floatval($voiceSettings['speed']))) : 1;
        
        return $validated;
    }

    /**
     * Get supported language boost options
     *
     * @return array
     */
    public function getLanguageBoostOptions()
    {
        return [
            'Auto' => 'Auto Detect',
            'Vietnamese' => 'Vietnamese',
            'English' => 'English',
            'Afrikaans' => 'Afrikaans',
            'Arabic' => 'Arabic',
            'Armenian' => 'Armenian',
            'Assamese' => 'Assamese',
            'Azerbaijani' => 'Azerbaijani',
            'Belarusian' => 'Belarusian',
            'Bengali' => 'Bengali',
            'Bosnian' => 'Bosnian',
            'Bulgarian' => 'Bulgarian',
            'Catalan' => 'Catalan',
            'Cebuano' => 'Cebuano',
            'Chichewa' => 'Chichewa',
            'Chinese' => 'Chinese',
            'Croatian' => 'Croatian',
            'Czech' => 'Czech',
            'Danish' => 'Danish',
            'Dutch' => 'Dutch',
            'Estonian' => 'Estonian',
            'Filipino' => 'Filipino',
            'Finnish' => 'Finnish',
            'French' => 'French',
            'Galician' => 'Galician',
            'Georgian' => 'Georgian',
            'German' => 'German',
            'Greek' => 'Greek',
            'Gujarati' => 'Gujarati',
            'Hausa' => 'Hausa',
            'Hebrew' => 'Hebrew',
            'Hindi' => 'Hindi',
            'Hungarian' => 'Hungarian',
            'Icelandic' => 'Icelandic',
            'Indonesian' => 'Indonesian', 
            'Italian' => 'Italian',
            'Japanese' => 'Japanese', 
            'Korean' => 'Korean',
            'Malay' => 'Malay',
            'Portuguese' => 'Portuguese', 
            'Polish' => 'Polish',
            'Russian' => 'Russian',  
            'Romanian' => 'Romanian',
            'Spanish' => 'Spanish', 
            'Swedish' => 'Swedish',
            'Thai' => 'Thai',
            'Turkish' => 'Turkish',
            'Ukrainian' => 'Ukrainian',
            'Urdu' => 'Urdu',
        ];
    }
}
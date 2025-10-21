<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class AIProcessController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Process text using OpenAI API
     */
    public function processText(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'prompt' => 'required|string',
                'model' => 'string|in:gpt-4.1-mini',
                'max_tokens' => 'integer|min:1|max:4000',
                'temperature' => 'numeric|min:0|max:2'
            ]);

            $openaiApiKey = env('OPENAI_API_KEY');
            
            if (!$openaiApiKey) {
                return response()->json([
                    'success' => false,
                    'error' => 'OpenAI API key not configured'
                ], 500);
            }

            // Prepare request data for OpenAI
            $requestData = [
                'model' => $validated['model'] ?? 'gpt-4.1-mini',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $validated['prompt']
                    ]
                ],
                'max_tokens' => $validated['max_tokens'] ?? 1000,
                'temperature' => $validated['temperature'] ?? 0.7
            ];

            // Make request to OpenAI API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $openaiApiKey,
                'Content-Type' => 'application/json'
            ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', $requestData);

            if ($response->successful()) {
                $data = $response->json();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'text' => $data['choices'][0]['message']['content'] ?? '',
                        'usage' => $data['usage'] ?? null
                    ]
                ]);
            } else {
                Log::error('OpenAI API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Failed to process text with OpenAI API',
                    'details' => $response->json()
                ], $response->status());
            }

        } catch (Exception $e) {
            Log::error('AI Process Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process text using Gemini API with OpenAI fallback
     */
    public function processTextGemini(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'prompt' => 'required|string',
                'model' => 'string|in:gemini-2.5-flash',
                'max_tokens' => 'integer|min:1|max:4000',
                'temperature' => 'numeric|min:0|max:2'
            ]);

            $geminiApiKey = env('GEMINI_API_KEY');
            
            // Try Gemini first if API key is available
            if ($geminiApiKey) {
                try {
                    $model = $validated['model'] ?? 'gemini-2.5-flash';
                    
                    // Prepare request data for Gemini
                    $requestData = [
                        'contents' => [
                            [
                                'parts' => [
                                    [
                                        'text' => $validated['prompt']
                                    ]
                                ]
                            ]
                        ],
                        'generationConfig' => [
                            'temperature' => $validated['temperature'] ?? 0.7,
                            'maxOutputTokens' => $validated['max_tokens'] ?? 1000
                        ]
                    ];

                    // Make request to Gemini API
                    $response = Http::withHeaders([
                        'Content-Type' => 'application/json'
                    ])->timeout(60)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$geminiApiKey}", $requestData);

                    if ($response->successful()) {
                        $data = $response->json();
                        
                        $text = '';
                        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                            $text = $data['candidates'][0]['content']['parts'][0]['text'];
                        }
                        
                        return response()->json([
                            'success' => true,
                            'data' => [
                                'text' => $text,
                                'usage' => $data['usageMetadata'] ?? null
                            ]
                        ]);
                    } else {
                        Log::warning('Gemini API failed, trying OpenAI fallback', [
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        // Continue to OpenAI fallback
                    }
                } catch (Exception $geminiError) {
                    Log::warning('Gemini API exception, trying OpenAI fallback', [
                        'message' => $geminiError->getMessage()
                    ]);
                    // Continue to OpenAI fallback
                }
            }

            // OpenAI fallback
            $openaiApiKey = env('OPENAI_API_KEY');
            
            if (!$openaiApiKey) {
                return response()->json([
                    'success' => false,
                    'error' => 'Both Gemini and OpenAI API keys are not configured'
                ], 500);
            }

            // Prepare request data for OpenAI
            $requestData = [
                'model' => 'gpt-4.1-mini',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $validated['prompt']
                    ]
                ],
                'max_tokens' => $validated['max_tokens'] ?? 1000,
                'temperature' => $validated['temperature'] ?? 0.7
            ];

            // Make request to OpenAI API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $openaiApiKey,
                'Content-Type' => 'application/json'
            ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', $requestData);

            if ($response->successful()) {
                $data = $response->json();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'text' => $data['choices'][0]['message']['content'] ?? '',
                        'usage' => $data['usage'] ?? null
                    ]
                ]);
            } else {
                Log::error('Both Gemini and OpenAI APIs failed', [
                    'openai_status' => $response->status(),
                    'openai_body' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Both Gemini and OpenAI APIs are currently unavailable',
                    'details' => $response->json()
                ], $response->status());
            }

        } catch (Exception $e) {
            Log::error('AI Process Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
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
                'model' => 'string|in:gpt-4.1-mini,gpt-3.5-turbo,gpt-4,gpt-4-turbo',
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

            // Prepare request data for OpenAI Responses API
            $requestData = [
                'model' => $validated['model'] ?? 'gpt-4.1-mini',
                'input' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $validated['prompt']
                            ]
                        ]
                    ]
                ],
                'max_output_tokens' => $validated['max_tokens'] ?? 1000,
                'temperature' => $validated['temperature'] ?? 0.7
            ];

            // Make request to OpenAI Responses API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $openaiApiKey,
                'Content-Type' => 'application/json'
            ])->timeout(60)->post('https://api.openai.com/v1/responses', $requestData);

            if ($response->successful()) {
                $data = $response->json();
                
                // Extract text from Responses API format
                $text = $data['output_text'] ?? '';
                if (!$text) {
                    if (isset($data['output'][0]['content'][0]['text'])) {
                        $text = $data['output'][0]['content'][0]['text'];
                    } elseif (isset($data['choices'][0]['message']['content'])) {
                        // Fallback in case some gateways still return chat-completions-like payload
                        $text = $data['choices'][0]['message']['content'];
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'text' => $text,
                        'usage' => $data['usage'] ?? ($data['usageMetadata'] ?? null)
                    ]
                ]);
            } else {
                Log::error('OpenAI API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                $errJson = $response->json();
                $errMsg = $errJson['error']['message'] ?? ($errJson['message'] ?? 'Failed to process text with OpenAI API');
                return response()->json([
                    'success' => false,
                    'error' => $errMsg,
                    'details' => $errJson
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
                'model' => 'string|in:gemini-2.5-flash,gemini-pro,gemini-1.5-flash',
                'max_tokens' => 'integer|min:1|max:4000',
                'temperature' => 'numeric|min:0|max:2'
            ]);

            $geminiApiKey = env('GEMINI_API_KEY');
            
            // Try Gemini first if API key is available
            if ($geminiApiKey) {
                try {
                    $model = $validated['model'] ?? 'gemini-2.5-flash';
                    
                    // Prepare request data for Gemini với system prompt
                    $requestData = [
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    [
                                        'text' => $validated['prompt']
                                    ]
                                ]
                            ]
                        ],
                        'systemInstruction' => [
                            'parts' => [
                                [
                                    'text' => 'Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi một cách trực tiếp và ngắn gọn. Không cần suy nghĩ quá nhiều, chỉ cần đưa ra câu trả lời phù hợp.'
                                ]
                            ]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.1, // Giảm temperature để trả lời trực tiếp
                            'maxOutputTokens' => $validated['max_tokens'] ?? 1000,
                            'candidateCount' => 1,
                            'stopSequences' => []
                        ],
                        'safetySettings' => [
                            [
                                'category' => 'HARM_CATEGORY_HARASSMENT',
                                'threshold' => 'BLOCK_ONLY_HIGH'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                                'threshold' => 'BLOCK_ONLY_HIGH'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                'threshold' => 'BLOCK_ONLY_HIGH'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                'threshold' => 'BLOCK_ONLY_HIGH'
                            ]
                        ]
                    ];

                    // Make request to Gemini API
                    $response = Http::withHeaders([
                        'Content-Type' => 'application/json'
                    ])->timeout(60)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$geminiApiKey}", $requestData);

                    if ($response->successful()) {
                        $data = $response->json();
                        
                        // Debug log để xem full response
                        Log::info('Gemini API Response', ['full_response' => $data]);
                        
                        $text = '';
                        
                        // Trích xuất text từ nhiều cấp độ khác nhau
                        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                            $text = $data['candidates'][0]['content']['parts'][0]['text'];
                        } elseif (isset($data['candidates'][0]['content']['parts'][0])) {
                            // Nếu parts[0] là object khác
                            $part = $data['candidates'][0]['content']['parts'][0];
                            if (is_string($part)) {
                                $text = $part;
                            } elseif (isset($part['text'])) {
                                $text = $part['text'];
                            }
                        }
                        
                        // Nếu vẫn rỗng, thử các cấp độ khác
                        if (empty($text) && isset($data['output'])) {
                            $text = is_string($data['output']) ? $data['output'] : json_encode($data['output']);
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

            // Prepare request data for OpenAI Responses API (fallback)
            $requestData = [
                'model' => 'gpt-4.1-mini',
                'input' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $validated['prompt']
                            ]
                        ]
                    ]
                ],
                'max_output_tokens' => $validated['max_tokens'] ?? 1000,
                'temperature' => $validated['temperature'] ?? 0.7
            ];

            // Make request to OpenAI Responses API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $openaiApiKey,
                'Content-Type' => 'application/json'
            ])->timeout(60)->post('https://api.openai.com/v1/responses', $requestData);

            if ($response->successful()) {
                $data = $response->json();
                
                // Extract text robustly
                $text = $data['output_text'] ?? '';
                if (!$text) {
                    if (isset($data['output'][0]['content'][0]['text'])) {
                        $text = $data['output'][0]['content'][0]['text'];
                    } elseif (isset($data['choices'][0]['message']['content'])) {
                        $text = $data['choices'][0]['message']['content'];
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'text' => $text,
                        'usage' => $data['usage'] ?? ($data['usageMetadata'] ?? null)
                    ]
                ]);
            } else {
                Log::error('Both Gemini and OpenAI APIs failed', [
                    'openai_status' => $response->status(),
                    'openai_body' => $response->body()
                ]);

                $errJson = $response->json();
                $errMsg = $errJson['error']['message'] ?? ($errJson['message'] ?? 'Both Gemini and OpenAI APIs are currently unavailable');
                return response()->json([
                    'success' => false,
                    'error' => $errMsg,
                    'details' => $errJson
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
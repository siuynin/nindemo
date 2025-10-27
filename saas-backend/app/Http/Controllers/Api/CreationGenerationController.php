<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CreationGenerationController extends Controller
{
    /**
     * Get user's creation generations (audio, text, etc.)
     */
    public function getUserGenerations(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $perPage = $request->get('per_page', 20);
            
            // Get audio and text types for creations
            $generations = Generate::where('user_id', $user->id)
                ->whereIn('type', ['audio', 'text', 'tts', 'chat'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Transform data to include parsed content and proper prompt
            $transformedGenerations = [];
            foreach ($generations->items() as $generation) {
                // Parse content JSON to get prompt and settings
                $contentData = json_decode($generation->content, true) ?? [];
                
                // Get prompt from content data based on type
                $prompt = '';
                switch ($generation->type) {
                    case 'audio':
                    case 'tts':
                        $prompt = $contentData['text'] ?? $contentData['prompt'] ?? $generation->name ?? '';
                        break;
                    case 'text':
                    case 'chat':
                        $prompt = $contentData['prompt'] ?? $contentData['message'] ?? $generation->name ?? '';
                        break;
                    default:
                        $prompt = $contentData['prompt'] ?? $generation->name ?? '';
                        break;
                }
                
                $transformedGenerations[] = [
                    'id' => $generation->id,
                    'name' => $generation->name,
                    'prompt' => $prompt,
                    'status' => $generation->status,
                    'result_url' => $generation->result_url,
                    'created_at' => $generation->created_at,
                    'completed_at' => $generation->completed_at,
                    'error_message' => $generation->error_message,
                    'credit_cost' => $generation->credit_cost,
                    'task_id' => $generation->task_id,
                    'content' => $generation->content,
                    'type' => $generation->type,
                    'share' => $generation->share,
                    'settings' => $contentData['settings'] ?? []
                ];
            }

            // Debug log
            Log::info('Creation generations being returned:', [
                'user_id' => $user->id,
                'total_generations' => $generations->total(),
                'returned_count' => count($transformedGenerations)
            ]);

            return response()->json([
                'success' => true,
                'data' => $transformedGenerations,
                'pagination' => [
                    'current_page' => $generations->currentPage(),
                    'last_page' => $generations->lastPage(),
                    'per_page' => $generations->perPage(),
                    'total' => $generations->total(),
                    'from' => $generations->firstItem(),
                    'to' => $generations->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get User Creation Generations Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get specific creation generation by ID
     */
    public function getCreationGeneration($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $generation = Generate::where('user_id', $user->id)
                ->whereIn('type', ['audio', 'text', 'tts', 'chat'])
                ->where('id', $id)
                ->first();

            if (!$generation) {
                return response()->json(['error' => 'Generation not found'], 404);
            }

            // Parse content
            $contentData = json_decode($generation->content, true) ?? [];
            
            // Get prompt based on type
            $prompt = '';
            switch ($generation->type) {
                case 'audio':
                case 'tts':
                    $prompt = $contentData['text'] ?? $contentData['prompt'] ?? $generation->name ?? '';
                    break;
                case 'text':
                case 'chat':
                    $prompt = $contentData['prompt'] ?? $contentData['message'] ?? $generation->name ?? '';
                    break;
                default:
                    $prompt = $contentData['prompt'] ?? $generation->name ?? '';
                    break;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $generation->id,
                    'name' => $generation->name,
                    'prompt' => $prompt,
                    'status' => $generation->status,
                    'result_url' => $generation->result_url,
                    'created_at' => $generation->created_at,
                    'completed_at' => $generation->completed_at,
                    'error_message' => $generation->error_message,
                    'credit_cost' => $generation->credit_cost,
                    'task_id' => $generation->task_id,
                    'content' => $generation->content,
                    'type' => $generation->type,
                    'share' => $generation->share,
                    'settings' => $contentData['settings'] ?? []
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get Creation Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }
}
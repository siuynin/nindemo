<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DocumentGenerationController extends Controller
{
    /**
     * Get user's document generations
     */
    public function getUserGenerations(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $perPage = $request->get('per_page', 20);
            
            $generations = Generate::where('user_id', $user->id)
                ->where('type', 'text')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Transform data to include parsed content and proper prompt
            $transformedGenerations = [];
            foreach ($generations->items() as $generation) {
                // Parse content JSON to get prompt and settings
                $contentData = json_decode($generation->content, true) ?? [];
                
                // Get prompt from content data
                $prompt = $contentData['prompt'] ?? $contentData['topic'] ?? $generation->name ?? '';
                
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
            Log::info('Document generations being returned:', [
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
            Log::error('Get User Document Generations Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get specific document generation by ID
     */
    public function getDocumentGeneration($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $generation = Generate::where('user_id', $user->id)
                ->where('type', 'text')
                ->where('id', $id)
                ->first();

            if (!$generation) {
                return response()->json(['error' => 'Generation not found'], 404);
            }

            // Parse content
            $contentData = json_decode($generation->content, true) ?? [];
            $prompt = $contentData['prompt'] ?? $contentData['topic'] ?? $generation->name ?? '';

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
            Log::error('Get Document Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Services\ElevenLabsService;
use App\Services\MinimaxService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class UserGenerateController extends Controller
{
    /**
     * Display a listing of user's generates.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Generate::where('user_id', $user->id)
            ->with(['user:id,name,email'])
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->filled('type') && $request->get('type') !== '') {
            $query->where('type', $request->get('type'));
        }

        // Filter by share
        if ($request->filled('share') && $request->get('share') !== '') {
            $query->where('share', $request->get('share'));
        }

        // Filter by status
        if ($request->filled('status') && $request->get('status') !== '') {
            $query->where('status', $request->get('status'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $perPage = $request->get('per_page', 15);
        $generates = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $generates->items(),
            'pagination' => [
                'current_page' => $generates->currentPage(),
                'last_page' => $generates->lastPage(),
                'per_page' => $generates->perPage(),
                'total' => $generates->total(),
                'from' => $generates->firstItem(),
                'to' => $generates->lastItem(),
            ]
        ]);
    }

    /**
     * Store a newly created generate.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'type' => 'required|string|max:255',
            'status' => 'nullable|string|in:pending,processing,completed,failed',
            'share' => 'nullable|string|in:private,public',
            'file_patch' => 'nullable|string|max:500',
            'task_id' => 'nullable|string|max:255',
            'credit_cost' => 'nullable|numeric|min:0',
            'voice_id' => 'nullable|string|max:255',
            'voice_settings' => 'nullable|array',
            'result_url' => 'nullable|string',
            'model' => 'nullable|string|max:255',
            'language_boost' => 'nullable|string|max:255',
            'with_transcript' => 'nullable|boolean',
            'receive_url' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $generate = Generate::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'content' => $request->content,
            'type' => $request->type,
            'status' => $request->status ?? 'pending',
            'share' => $request->share ?? 'private',
            'file_patch' => $request->file_patch,
            'task_id' => $request->task_id,
            'credit_cost' => $request->credit_cost ?? 0.0,
            'result_url' => $request->result_url
        ]);

        // If this is an audio generation request, call ElevenLabs API
        if ($request->type === 'audio') {
            $elevenLabsService = new ElevenLabsService();
            
            // Calculate cost
            $estimatedCost = $elevenLabsService->calculateCost($request->content ?? '');
            
            // Call ElevenLabs API
            $result = $elevenLabsService->textToSpeech(
                $request->content ?? '',
                $request->voice_id ?? 'pNInz6obpgDQGcFmaJgB',
                $request->model ?? 'eleven_v3',
                $request->voice_settings ?? null
            );
            
            if ($result['success']) {
                // Update with task_id, cost and processing status
                 $generate->update([
                     'task_id' => $result['task_id'] ?? null, 
                     'credit_cost' => $estimatedCost,
                     'status' => 'processing'
                 ]);
                 
                 // Audio will be received via webhook when completed
                
                // Deduct credits from user (you may want to implement this)
                // $user = Auth::user();
                // $user->decrement('credits', $estimatedCost);
                
            } else {
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $result['error']
                ]);
            }
        }

        // If this is a Minimax audio generation request, call Minimax API
        if ($request->type === 'minimax-audio') {
            $minimaxService = new MinimaxService();
            
            // Calculate cost
            $estimatedCost = $minimaxService->calculateCost($request->content ?? '');
            
            // Call Minimax API
            $result = $minimaxService->textToSpeech(
                $request->content ?? '',
                $request->model ?? 'speech-2.5-hd-preview',
                $request->voice_settings ?? [
                    'voice_id' => '209533299589184',
                    'vol' => 1,
                    'pitch' => 0,
                    'speed' => 1
                ],
                $request->language_boost ?? 'Auto',
                $request->with_transcript ?? false,
                $request->receive_url ?? null
            );
            
            if ($result['success']) {
                // Update with task_id, cost and processing status
                 $generate->update([
                     'task_id' => $result['task_id'] ?? null, 
                     'credit_cost' => $estimatedCost,
                     'status' => 'processing'
                 ]);
                 
                 // Audio will be received via webhook when completed
                
                // Deduct credits from user (you may want to implement this)
                // $user = Auth::user();
                // $user->decrement('credits', $estimatedCost);
                
            } else {
                $generate->update([
                    'status' => 'failed',
                    'error_message' => $result['error']
                ]);
            }
        }

        $generate->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Generate created successfully',
            'data' => $generate
        ], 201);
    }

    /**
     * Display the specified generate.
     */
    public function show(string $id): JsonResponse
    {
        $generate = Generate::where('user_id', Auth::id())
            ->with(['user:id,name,email'])
            ->find($id);

        if (!$generate) {
            return response()->json([
                'success' => false,
                'message' => 'Generate not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $generate
        ]);
    }

    /**
     * Update the specified generate.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $generate = Generate::where('user_id', Auth::id())->find($id);

        if (!$generate) {
            return response()->json([
                'success' => false,
                'message' => 'Generate not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'type' => 'sometimes|required|string|max:255',
            'status' => 'nullable|string|in:pending,processing,completed,failed',
            'share' => 'nullable|string|in:private,public',
            'file_patch' => 'nullable|string|max:500',
            'task_id' => 'nullable|string|max:255',
            'credit_cost' => 'nullable|numeric|min:0',
            'result_url' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $generate->update($request->only([
            'name', 'content', 'type', 'status', 'share', 'file_patch', 'task_id', 'credit_cost', 'result_url'
        ]));

        $generate->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Generate updated successfully',
            'data' => $generate
        ]);
    }

    /**
     * Remove the specified generate.
     */
    public function destroy(string $id): JsonResponse
    {
        $generate = Generate::where('user_id', Auth::id())->find($id);

        if (!$generate) {
            return response()->json([
                'success' => false,
                'message' => 'Generate not found'
            ], 404);
        }

        $generate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Generate deleted successfully'
        ]);
    }

    /**
     * Get user's generate statistics.
     */
    public function statistics(): JsonResponse
    {
        $user = Auth::user();
        
        $stats = [
            'total_generates' => Generate::where('user_id', $user->id)->count(),
            'completed_generates' => Generate::where('user_id', $user->id)
                ->where('status', 'completed')->count(),
            'failed_generates' => Generate::where('user_id', $user->id)
                ->where('status', 'failed')->count(),
            'total_credit_cost' => Generate::where('user_id', $user->id)
                ->sum('credit_cost'),
            'recent_generates' => Generate::where('user_id', $user->id)
                ->with(['user:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get available types for generates.
     */
    public function types(): JsonResponse
    {
        $types = Generate::select('type')
            ->distinct()
            ->whereNotNull('type')
            ->orderBy('type')
            ->pluck('type');

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    /**
     * Download the generated audio file.
     */
    public function download(string $id)
    {
        $generate = Generate::where('user_id', Auth::id())->find($id);

        if (!$generate) {
            return response()->json([
                'success' => false,
                'message' => 'Generate not found'
            ], 404);
        }

        if (!$generate->result_url) {
            return response()->json([
                'success' => false,
                'message' => 'No audio file available for this generate'
            ], 404);
        }

        // If result_url is a full URL (from ElevenLabs), proxy the request
        if (filter_var($generate->result_url, FILTER_VALIDATE_URL)) {
            try {
                $response = file_get_contents($generate->result_url);
                
                if ($response === false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to fetch audio file'
                    ], 500);
                }

                return response($response, 200, [
                    'Content-Type' => 'audio/mpeg',
                    'Content-Disposition' => 'attachment; filename="' . $generate->name . '.mp3"',
                    'Cache-Control' => 'no-cache, must-revalidate'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error downloading audio: ' . $e->getMessage()
                ], 500);
            }
        }

        // If result_url is a local file path
        $filePath = ltrim($generate->result_url, '/');
        // Remove 'storage/' prefix if it exists since we're already in storage/app
        $filePath = preg_replace('/^storage\//', '', $filePath);
        
        // Check if file exists in storage/app directory
        $fullPath = storage_path('app/' . $filePath);
        
        if (file_exists($fullPath)) {
            return response()->download($fullPath, $generate->name . '.mp3');
        }
        return response()->json([
            'success' => false,
            'message' => 'Audio file not found'
        ], 404);
    }
}
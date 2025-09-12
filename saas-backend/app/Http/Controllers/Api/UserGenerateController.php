<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Services\ElevenLabsService;
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
            'voice_settings' => 'nullable|array'
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
            'credit_cost' => $request->credit_cost ?? 0.0
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
                $request->voice_settings ?? []
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
            'credit_cost' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $generate->update($request->only([
            'name', 'content', 'type', 'status', 'share', 'file_patch', 'task_id', 'credit_cost'
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
}
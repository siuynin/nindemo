<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OpenAI;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class OpenAIController extends Controller
{
    /**
     * Display a listing of OpenAI templates.
     */
    public function index(Request $request): JsonResponse
    {
        $query = OpenAI::query();
        
        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }
        
        // Filter by premium status
        if ($request->has('premium')) {
            $query->where('premium', $request->boolean('premium'));
        }
        
        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }
        
        // Search by title or description
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        // Filter by filters field
        if ($request->has('filters') && !empty($request->get('filters'))) {
            $filters = $request->get('filters');
            $query->where(function ($q) use ($filters) {
                $q->where('filters', 'like', "%{$filters}%")
                  ->orWhereJsonContains('filters', $filters);
            });
        }
        
        $templates = $query->orderBy('created_at', 'desc')
                          ->paginate($request->get('per_page', 15));
        
        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'pagination' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
                'from' => $templates->firstItem(),
                'to' => $templates->lastItem(),
            ]
        ]);
    }
    
    /**
     * Store a newly created OpenAI template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|string|max:100',
            'prompt' => 'required|string',
            'active' => 'boolean',
            'premium' => 'boolean',
            'custom_template' => 'boolean',
            'tone_of_voice' => 'boolean',
            'questions' => 'nullable|array',
            'image' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'filters' => 'nullable|array',
            'package' => 'nullable|array'
        ]);
        
        // Generate slug from title
        $validated['slug'] = Str::slug($validated['title']);
        
        // Set user_id to authenticated user
        $validated['user_id'] = auth()->id();
        
        $template = OpenAI::create($validated);
        
        return response()->json([
            'message' => 'Template created successfully',
            'data' => $template
        ], 201);
    }
    
    /**
     * Display the specified OpenAI template.
     */
    public function show($id): JsonResponse
    {
        $template = OpenAI::findOrFail($id);
        
        return response()->json([
            'data' => $template
        ]);
    }
    
    /**
     * Update the specified OpenAI template.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $template = OpenAI::findOrFail($id);
        
        // Check if user owns the template or is admin
        if ($template->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'message' => 'Unauthorized to update this template'
            ], 403);
        }
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'type' => 'sometimes|required|string|max:100',
            'prompt' => 'sometimes|required|string',
            'active' => 'boolean',
            'premium' => 'boolean',
            'custom_template' => 'boolean',
            'tone_of_voice' => 'boolean',
            'questions' => 'nullable|array',
            'image' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'filters' => 'nullable|array',
            'package' => 'nullable|array'
        ]);
        
        // Update slug if title is changed
        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }
        
        $template->update($validated);
        
        return response()->json([
            'message' => 'Template updated successfully',
            'data' => $template->fresh()
        ]);
    }
    
    /**
     * Remove the specified OpenAI template.
     */
    public function destroy($id): JsonResponse
    {
        $template = OpenAI::findOrFail($id);
        
        // Check if user owns the template or is admin
        if ($template->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'message' => 'Unauthorized to delete this template'
            ], 403);
        }
        
        $template->delete();
        
        return response()->json([
            'message' => 'Template deleted successfully'
        ]);
    }
    
    /**
     * Get templates by type.
     */
    public function byType($type): JsonResponse
    {
        $templates = OpenAI::where('type', $type)
                          ->active()
                          ->orderBy('created_at', 'desc')
                          ->get();
        
        return response()->json([
            'data' => $templates
        ]);
    }
    
    /**
     * Get templates by user.
     */
    public function byUser($userId): JsonResponse
    {
        // Check if requesting own templates or is admin
        if ($userId != auth()->id() && !auth()->user()->hasRole('admin')) {
            return response()->json([
                'message' => 'Unauthorized to view these templates'
            ], 403);
        }
        
        $templates = OpenAI::where('user_id', $userId)
                          ->orderBy('created_at', 'desc')
                          ->get();
        
        return response()->json([
            'data' => $templates
        ]);
    }

    /**
     * Get filter options for templates.
     */
    public function filterOptions(): JsonResponse
    {
        $filters = OpenAI::distinct()->pluck('filters')->filter()->flatten()->unique()->values();
        $categories = OpenAI::distinct()->pluck('type')->filter()->unique()->values();
        $models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3', 'gemini-pro'];
        
        return response()->json([
            'success' => true,
            'data' => [
                'filters' => $filters,
                'categories' => $categories,
                'models' => $models
            ]
        ]);
    }
}
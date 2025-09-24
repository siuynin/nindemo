<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AIModel::query();
        
        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('platform', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }
        
        // Filter by platform
        if ($request->has('platform') && !empty($request->platform)) {
            $query->where('platform', $request->platform);
        }
        
        // Filter by type
        if ($request->has('type') && !empty($request->type)) {
            $query->where('type', $request->type);
        }
        
        // Sort
        $sortBy = $request->get('sort_by', 'credit_price');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $models = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $models->items(),
            'pagination' => [
                'current_page' => $models->currentPage(),
                'last_page' => $models->lastPage(),
                'per_page' => $models->perPage(),
                'total' => $models->total(),
                'from' => $models->firstItem(),
                'to' => $models->lastItem(),
            ]
        ]);
    }

    /**
     * Get all platforms and types for filters
     */
    public function filters(): JsonResponse
    {
        $platforms = AIModel::distinct()->pluck('platform')->filter()->values();
        $types = AIModel::distinct()->pluck('type')->filter()->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'platforms' => $platforms,
                'types' => $types
            ]
        ]);
    }

    /**
     * Get featured models (latest or most popular)
     */
    public function featured(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 6);
        
        $models = AIModel::orderBy('created_at', 'desc')
                         ->limit($limit)
                         ->get();
        
        return response()->json([
            'success' => true,
            'data' => $models
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug): JsonResponse
    {
        $model = AIModel::where('slug', $slug)->first();
        
        if (!$model) {
            return response()->json([
                'success' => false,
                'message' => 'Model not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $model
        ]);
    }

    /**
     * Get models by platform
     */
    public function byPlatform(string $platform): JsonResponse
    {
        $models = AIModel::where('platform', $platform)
                         ->orderBy('name')
                         ->get();
        
        return response()->json([
            'success' => true,
            'data' => $models
        ]);
    }
    
    /**
     * Get models by type
     */
    public function byType(string $type): JsonResponse
    {
        $models = AIModel::where('type', $type)
                         ->orderBy('name')
                         ->get();
        
        return response()->json([
            'success' => true,
            'data' => $models
        ]);
    }
}

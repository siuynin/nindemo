<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PublicGenerateController extends Controller
{
    /**
     * Get public generate images
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            
            // Validate per_page limit
            if ($perPage > 50) {
                $perPage = 50;
            }
            
            $query = Generate::where('share', 'public')
                ->where('status', 'completed')
                ->whereNotNull('result_url')
                ->where('result_url', '!=', '')
                ->with('user:id,name')
                ->orderBy('created_at', 'desc');
            
            // Filter by type if provided
            if ($request->has('type')) {
                $query->where('type', $request->get('type'));
            }
            
            // Search by name if provided
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where('name', 'LIKE', "%{$search}%");
            }
            
            $generates = $query->paginate($perPage, [
                'id',
                'user_id', 
                'name',
                'type',
                'content',
                'result_url',
                'created_at'
            ]);
            
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
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch public generates',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get a specific public generate by ID
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $generate = Generate::where('id', $id)
                ->where('share', 'public')
                ->where('status', 'completed')
                ->whereNotNull('result_url')
                ->where('result_url', '!=', '')
                ->with('user:id,name')
                ->first([
                    'id',
                    'user_id',
                    'name',
                    'content',
                    'type',
                    'result_url',
                    'created_at'
                ]);
                
            if (!$generate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Generate not found or not public'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $generate
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch generate',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Generate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GenerateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Generate::with('user');
        
        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        // Filter by user if provided
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filter by type if provided
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        
        // Filter by status if provided
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        $generates = $query->orderBy('created_at', 'desc')->paginate(15);
        
        // Return JSON for API requests
        if ($request->expectsJson()) {
            return response()->json($generates);
        }
        
        // Return view for web requests
        return view('admin.generates.index', compact('generates'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'type' => 'required|string|max:255',
            'status' => 'nullable|string|max:255',
            'share' => 'nullable|string|max:255',
            'file_patch' => 'nullable|string|max:255',
            'task_id' => 'nullable|string|max:255',
            'credit_cost' => 'nullable|numeric|min:0'
        ]);
        
        $generate = Generate::create($validated);
        $generate->load('user');
        
        return response()->json($generate, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Generate $generate): JsonResponse
    {
        $generate->load('user');
        return response()->json($generate);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Generate $generate): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'type' => 'sometimes|string|max:255',
            'status' => 'nullable|string|max:255',
            'share' => 'nullable|string|max:255',
            'result_url' => 'nullable|string|max:255',
            'task_id' => 'nullable|string|max:255',
            'credit_cost' => 'nullable|numeric|min:0'
        ]);
        
        $generate->update($validated);
        $generate->load('user');
        
        return response()->json([
            'success' => true,
            'message' => 'Generate updated successfully',
            'data' => $generate
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Generate $generate)
    {
        $generate->delete();
        
        // Return JSON for API requests
        if (request()->expectsJson()) {
            return response()->json([
                'message' => 'Generate deleted successfully'
            ]);
        }
        
        // Return redirect for web requests
        return redirect()->route('admin.generates.index')
                    ->with('success', 'Generate deleted successfully');
    }
}

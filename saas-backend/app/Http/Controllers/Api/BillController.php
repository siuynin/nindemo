<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BillController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Bill::with('user')->where('user_id', Auth::id());

        // Filter by status if provided
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Sort by created_at desc by default
        $bills = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $bills
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'sometimes|string|size:3',
            'description' => 'nullable|string|max:1000',
            'payment_method' => ['nullable', Rule::in(['credit_card', 'paypal', 'bank_transfer', 'stripe', 'other'])],
            'due_date' => 'nullable|date|after:now',
            'metadata' => 'nullable|array'
        ]);

        $validated['user_id'] = Auth::id();

        $bill = Bill::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bill created successfully',
            'data' => $bill->load('user')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $bill = Bill::with('user')
                   ->where('user_id', Auth::id())
                   ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $bill
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $bill = Bill::where('user_id', Auth::id())->findOrFail($id);

        // Prevent updating paid bills
        if ($bill->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update a paid bill'
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0.01',
            'currency' => 'sometimes|string|size:3',
            'description' => 'nullable|string|max:1000',
            'status' => ['sometimes', Rule::in(['pending', 'paid', 'failed', 'cancelled', 'refunded'])],
            'payment_method' => ['nullable', Rule::in(['credit_card', 'paypal', 'bank_transfer', 'stripe', 'other'])],
            'transaction_id' => 'nullable|string',
            'due_date' => 'nullable|date',
            'metadata' => 'nullable|array'
        ]);

        // Auto set paid_at when status is changed to paid
        if (isset($validated['status']) && $validated['status'] === 'paid' && !$bill->isPaid()) {
            $validated['paid_at'] = now();
        }

        $bill->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bill updated successfully',
            'data' => $bill->fresh('user')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $bill = Bill::where('user_id', Auth::id())->findOrFail($id);

        // Prevent deleting paid bills
        if ($bill->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a paid bill'
            ], 422);
        }

        $bill->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bill deleted successfully'
        ]);
    }

    /**
     * Get bills statistics for the authenticated user.
     */
    public function stats(): JsonResponse
    {
        $userId = Auth::id();
        
        $stats = [
            'total_bills' => Bill::byUser($userId)->count(),
            'paid_bills' => Bill::byUser($userId)->byStatus('paid')->count(),
            'pending_bills' => Bill::byUser($userId)->byStatus('pending')->count(),
            'failed_bills' => Bill::byUser($userId)->byStatus('failed')->count(),
            'total_amount' => Bill::byUser($userId)->sum('amount'),
            'paid_amount' => Bill::byUser($userId)->byStatus('paid')->sum('amount'),
            'pending_amount' => Bill::byUser($userId)->byStatus('pending')->sum('amount')
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

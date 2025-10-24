<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserCredit;
use App\Models\PricingPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserCreditController extends Controller
{
    /**
     * Get user's credits history
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $credits = $user->credits()->with('pricingPlan')->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'credits' => $credits,
                'total_remaining' => $user->total_remaining_credits
            ]
        ]);
    }

    /**
     * Get user's credits summary
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $activeCredits = $user->activeCredits()->get();
        $expiredCredits = $user->credits()->expired()->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_remaining' => $user->total_remaining_credits,
                'active_credits_count' => $activeCredits->count(),
                'expired_credits_count' => $expiredCredits->count(),
                'total_used' => $user->credits()->sum('used_credits'),
                'active_credits' => $activeCredits,
                'next_expiry' => $activeCredits->min('expires_at')
            ]
        ]);
    }

    /**
     * Add credits to user (Admin only)
     */
    public function store(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'pricing_plan_id' => 'nullable|exists:pricing_plans,id',
            'total_credits' => 'required|integer|min:1',
            'expires_at' => 'required|date|after:now',
            'credit_type' => 'required|in:purchase,bonus,refund,admin_grant',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $credit = UserCredit::create([
            'user_id' => $user->id,
            'pricing_plan_id' => $request->pricing_plan_id,
            'total_credits' => $request->total_credits,
            'used_credits' => 0,
            'remaining_credits' => $request->total_credits,
            'expires_at' => $request->expires_at,
            'credit_type' => $request->credit_type,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Credits added successfully',
            'data' => ['credit' => $credit->load('pricingPlan')]
        ], 201);
    }

    /**
     * Use credits (Internal method for file operations)
     */
    public function useCredits(User $user, float $amount)
    {
        $activeCredits = $user->activeCredits()
            ->orderBy('expires_at', 'asc')
            ->get();

        $remainingAmount = $amount;
        $usedCredits = [];

        foreach ($activeCredits as $credit) {
            if ($remainingAmount <= 0) break;

            $canUse = min($credit->remaining_credits, $remainingAmount);
            
            if ($canUse > 0) {
                $credit->useCredits($canUse);
                $usedCredits[] = [
                    'credit_id' => $credit->id,
                    'amount_used' => $canUse
                ];
                $remainingAmount -= $canUse;
            }
        }

        if ($remainingAmount > 0) {
            return [
                'success' => false,
                'message' => 'Insufficient credits. Please top up your account.',
                'required' => $amount,
                'available' => $amount - $remainingAmount
            ];
        }

        return [
            'success' => true,
            'message' => 'Credits used successfully',
            'used_credits' => $usedCredits,
            'total_used' => $amount
        ];
    }

    /**
     * Deduct credits from user account
     */
    public function deductCredits(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
            'model_id' => 'nullable|integer',
            'operation_type' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $amount = $request->input('amount');
        
        // Use the useCredits method to handle deduction
        $result = $this->useCredits($user, $amount);
        
        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        // Create transaction record
        $transaction = $user->creditTransactions()->create([
            'amount' => $amount,
            'type' => 'deduct',
            'description' => $request->input('description', 'Credits deducted'),
            'model_id' => $request->input('model_id'),
            'operation_type' => $request->input('operation_type'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Credits deducted successfully',
            'data' => [
                'deducted_amount' => $amount,
                'remaining_credits' => $user->total_remaining_credits,
                'transaction_id' => $transaction->id
            ]
        ]);
    }

    /**
     * Add credits to user account
     */
    public function addCredits(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
            'credit_type' => 'nullable|string|in:purchase,bonus,refund,admin_grant',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $amount = $request->input('amount');
        $creditType = $request->input('credit_type', 'bonus');
        
        // Create credit record
        $credit = UserCredit::create([
            'user_id' => $user->id,
            'total_credits' => $amount,
            'used_credits' => 0,
            'remaining_credits' => $amount,
            'credit_type' => $creditType,
            'expires_at' => now()->addYear(), // Default 1 year expiry
            'notes' => $request->input('description', 'Credits added'),
        ]);

        // Create transaction record
        $transaction = $user->creditTransactions()->create([
            'amount' => $amount,
            'type' => 'add',
            'description' => $request->input('description', 'Credits added'),
            'operation_type' => $creditType,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Credits added successfully',
            'data' => [
                'added_amount' => $amount,
                'remaining_credits' => $user->total_remaining_credits,
                'transaction_id' => $transaction->id
            ]
        ]);
    }

    /**
     * Refund credits to user account (API endpoint)
     */
    public function refundCredits(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $amount = $request->input('amount');
        $description = $request->input('description', 'Credits refunded');
        
        $result = $this->refundCreditsInternal($user, $amount, $description);
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Credits refunded successfully',
                'data' => [
                    'refunded_amount' => $amount,
                    'remaining_credits' => $user->total_remaining_credits,
                    'transaction_id' => $result['transaction_id']
                ]
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 500);
        }
    }

    /**
     * Internal method to refund credits (for use by other controllers)
     */
    public function refundCreditsInternal(User $user, float $amount, string $description = 'Credits refunded')
    {
        try {
            // Create credit record for refund
            $credit = UserCredit::create([
                'user_id' => $user->id,
                'total_credits' => $amount,
                'used_credits' => 0,
                'remaining_credits' => $amount,
                'credit_type' => 'refund',
                'expires_at' => now()->addYear(), // Default 1 year expiry
                'notes' => $description,
            ]);

            // Create transaction record
            $transaction = $user->creditTransactions()->create([
                'amount' => $amount,
                'type' => 'refund',
                'description' => $description,
            ]);

            return [
                'success' => true,
                'credit_id' => $credit->id,
                'transaction_id' => $transaction->id
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to refund credits: ' . $e->getMessage()
            ];
        }
    }
}

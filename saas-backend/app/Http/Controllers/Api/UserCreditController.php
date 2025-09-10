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
    public function useCredits(User $user, int $amount)
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
                'message' => 'Insufficient credits',
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
}

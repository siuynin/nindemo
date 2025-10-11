<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PricingPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PricingPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = PricingPlan::active()->orderBy('sort_order', 'asc')->get();
        
        return response()->json([
            'success' => true,
            'data' => ['pricing_plans' => $plans]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly,one_time',
            'credits' => 'required|integer|min:0',
            'features' => 'nullable|array',
            'max_voice_clone' => 'integer|min:0',
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $plan = PricingPlan::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pricing plan created successfully',
            'data' => ['pricing_plan' => $plan]
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PricingPlan $pricingPlan)
    {
        return response()->json([
            'success' => true,
            'data' => ['pricing_plan' => $pricingPlan]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PricingPlan $pricingPlan)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly,one_time',
            'credits' => 'required|integer|min:0',
            'features' => 'nullable|array',
            'max_voice_clone' => 'integer|min:0',
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $pricingPlan->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pricing plan updated successfully',
            'data' => ['pricing_plan' => $pricingPlan->fresh()]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PricingPlan $pricingPlan)
    {
        // Check if any users are using this plan
        if ($pricingPlan->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete pricing plan that has active users'
            ], 422);
        }

        $pricingPlan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pricing plan deleted successfully'
        ]);
    }

    /**
     * Activate free pricing plan for the authenticated user.
     */
    public function activateFree(PricingPlan $pricingPlan)
    {
        try {
            $user = auth()->user();
            
            // Check if the pricing plan is actually free
            if ($pricingPlan->price > 0) {
                return response()->json([
                    'message' => 'This pricing plan is not free.',
                    'success' => false
                ], 400);
            }
            
            // Update user's current pricing plan
            $user->current_pricing_plan_id = $pricingPlan->id;
            $user->plan_expires_at = $pricingPlan->duration_days ? now()->addDays($pricingPlan->duration_days) : null;
            $user->save();
            
            // Add credits for the user (similar to SePay logic)
            if ($pricingPlan->credits > 0) {
                \App\Models\UserCredit::create([
                    'user_id' => $user->id,
                    'pricing_plan_id' => $pricingPlan->id,
                    'total_credits' => $pricingPlan->credits,
                    'used_credits' => 0,
                    'remaining_credits' => $pricingPlan->credits,
                    'expires_at' => $pricingPlan->duration_days ? now()->addDays($pricingPlan->duration_days) : now()->addDays(31),
                    'credit_type' => 'monthly',
                    'notes' => "Credits from {$pricingPlan->name} plan activation (free)"
                ]);
                
                \Illuminate\Support\Facades\Log::info('Free plan activated with credits', [
                    'user_id' => $user->id,
                    'plan_id' => $pricingPlan->id,
                    'credits_added' => $pricingPlan->credits,
                    'expires_at' => $pricingPlan->duration_days ? now()->addDays($pricingPlan->duration_days)->toDateTimeString() : now()->addDays(31)->toDateTimeString()
                ]);
            }
            
            return response()->json([
                'message' => 'Free pricing plan activated successfully.',
                'success' => true,
                'data' => [
                    'user' => $user->load('pricingPlan'),
                    'pricing_plan' => $pricingPlan,
                    'credits_added' => $pricingPlan->credits ?? 0
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to activate free pricing plan.',
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

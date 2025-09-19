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
        $plans = PricingPlan::active()->ordered()->get();
        
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
}

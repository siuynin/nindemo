<?php

namespace App\Http\Controllers\Admin;

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
        $pricingPlans = PricingPlan::orderBy('price', 'asc')->paginate(10);
        return view('admin.pricing-plans.index', compact('pricingPlans'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('admin.pricing-plans.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:pricing_plans',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'credits' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive',
            'is_popular' => 'boolean',
            'features' => 'boolean',
            'max_voice_clone' => 'required|integer|min:0',
            'sort_order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        PricingPlan::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'credits' => $request->credits,
            'status' => $request->status,
            'is_popular' => $request->has('is_popular'),
            'features' => $request->has('features'),
            'max_voice_clone' => $request->max_voice_clone,
            'sort_order' => $request->sort_order
        ]);

        return redirect()->route('admin.pricing-plans.index')
                        ->with('success', 'Pricing plan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PricingPlan $pricingPlan)
    {
        $pricingPlan->load('userCredits.user');
        
        // If request expects JSON (AJAX call), return JSON response
        if (request()->expectsJson() || request()->ajax()) {
            return response()->json([
                'id' => $pricingPlan->id,
                'name' => $pricingPlan->name,
                'description' => $pricingPlan->description,
                'credits' => $pricingPlan->credits,
                'price' => $pricingPlan->price,
                'status' => $pricingPlan->status,
                'is_popular' => $pricingPlan->is_popular,
                'users_count' => $pricingPlan->users()->count(),
                'created_at' => $pricingPlan->created_at,
                'updated_at' => $pricingPlan->updated_at
            ]);
        }
        
        return view('admin.pricing-plans.show', compact('pricingPlan'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PricingPlan $pricingPlan)
    {
        return view('admin.pricing-plans.edit', compact('pricingPlan'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PricingPlan $pricingPlan)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:pricing_plans,name,' . $pricingPlan->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'credits' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive',
            'is_popular' => 'boolean',
            'features' => 'boolean',
            'max_voice_clone' => 'required|integer|min:0',
            'sort_order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        $pricingPlan->update([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'credits' => $request->credits,
            'status' => $request->status,
            'is_popular' => $request->has('is_popular'),
            'features' => $request->has('features'),
            'max_voice_clone' => $request->max_voice_clone,
            'sort_order' => $request->sort_order
        ]);

        return redirect()->route('admin.pricing-plans.index')
                        ->with('success', 'Pricing plan updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PricingPlan $pricingPlan)
    {
        // Check if pricing plan has associated user credits
        if ($pricingPlan->userCredits()->count() > 0) {
            return redirect()->back()
                           ->with('error', 'Cannot delete pricing plan that has associated user credits.');
        }

        $pricingPlan->delete();

        return redirect()->route('admin.pricing-plans.index')
                        ->with('success', 'Pricing plan deleted successfully.');
    }

    /**
     * Toggle active status
     */
    public function toggleActive(PricingPlan $pricingPlan)
    {
        $pricingPlan->update([
            'is_active' => !$pricingPlan->is_active
        ]);

        $status = $pricingPlan->is_active ? 'activated' : 'deactivated';
        return redirect()->back()
                        ->with('success', "Pricing plan {$status} successfully.");
    }
}

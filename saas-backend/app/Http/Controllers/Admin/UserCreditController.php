<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserCredit;
use App\Models\PricingPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserCreditController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = UserCredit::with(['user', 'pricingPlan']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('pricing_plan_id')) {
            $query->where('pricing_plan_id', $request->get('pricing_plan_id'));
        }

        $userCredits = $query->orderBy('created_at', 'desc')
                            ->paginate(20);

        $pricingPlans = PricingPlan::where('is_active', true)->get();

        return view('admin.user-credits.index', compact('userCredits', 'pricingPlans'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        $pricingPlans = PricingPlan::where('is_active', true)->orderBy('price')->get();
        
        return view('admin.user-credits.create', compact('users', 'pricingPlans'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
            'total_credits' => 'nullable|integer|min:0',
            'expires_at' => 'nullable|date|after:today'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        $pricingPlan = PricingPlan::findOrFail($request->pricing_plan_id);
        
        // Use custom credits if provided, otherwise use plan's default
        $totalCredits = $request->total_credits ?? $pricingPlan->credits;
        
        // Calculate expiry date if not provided
        $expiresAt = $request->expires_at;
        if (!$expiresAt) {
            switch ($pricingPlan->billing_cycle) {
                case 'monthly':
                    $expiresAt = now()->addMonth();
                    break;
                case 'yearly':
                    $expiresAt = now()->addYear();
                    break;
                case 'lifetime':
                    $expiresAt = null;
                    break;
            }
        }

        UserCredit::create([
            'user_id' => $request->user_id,
            'pricing_plan_id' => $request->pricing_plan_id,
            'total_credits' => $totalCredits,
            'used_credits' => 0,
            'expires_at' => $expiresAt
        ]);

        return redirect()->route('admin.user-credits.index')
                        ->with('success', 'User credits assigned successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(UserCredit $userCredit)
    {
        $userCredit->load(['user', 'pricingPlan']);
        return view('admin.user-credits.show', compact('userCredit'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(UserCredit $userCredit)
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        $pricingPlans = PricingPlan::where('is_active', true)->orderBy('price')->get();
        
        return view('admin.user-credits.edit', compact('userCredit', 'users', 'pricingPlans'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, UserCredit $userCredit)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
            'total_credits' => 'required|integer|min:0',
            'used_credits' => 'required|integer|min:0|lte:total_credits',
            'expires_at' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        $userCredit->update($request->all());

        return redirect()->route('admin.user-credits.index')
                        ->with('success', 'User credits updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserCredit $userCredit)
    {
        $userCredit->delete();

        return redirect()->route('admin.user-credits.index')
                        ->with('success', 'User credits deleted successfully.');
    }

    /**
     * Add credits to user
     */
    public function addCredits(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'credits' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        $user = User::findOrFail($request->user_id);
        
        // Find user's active credit record or create a new one
        $userCredit = UserCredit::where('user_id', $user->id)
                               ->where(function($q) {
                                   $q->whereNull('expires_at')
                                     ->orWhere('expires_at', '>', now());
                               })
                               ->first();

        if ($userCredit) {
            // Add to existing credits
            $userCredit->increment('total_credits', $request->credits);
        } else {
            // Create new credit record with Free plan
            $freePlan = PricingPlan::where('name', 'Free')->first();
            if (!$freePlan) {
                return redirect()->back()
                               ->with('error', 'Free plan not found. Please create a Free pricing plan first.');
            }

            UserCredit::create([
                'user_id' => $user->id,
                'pricing_plan_id' => $freePlan->id,
                'total_credits' => $request->credits,
                'used_credits' => 0,
                'expires_at' => null // No expiry for manually added credits
            ]);
        }

        return redirect()->back()
                        ->with('success', "Added {$request->credits} credits to {$user->name} successfully.");
    }

    /**
     * Show form to add credits to user
     */
    public function showAddCreditsForm()
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        return view('admin.user-credits.add-credits', compact('users'));
    }

    /**
     * Show credits for a specific user
     */
    public function userCredits(User $user)
    {
        $userCredits = $user->credits()->with('pricingPlan')->orderBy('created_at', 'desc')->paginate(20);
        
        $totalCredits = $user->credits->sum('total_credits');
        $usedCredits = $user->credits->sum('used_credits');
        $remainingCredits = $user->total_remaining_credits;
        
        return view('admin.user-credits.user-credits', compact('user', 'userCredits', 'totalCredits', 'usedCredits', 'remainingCredits'));
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\User;
use App\Models\PricingPlan;
use App\Models\UserCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BillController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Bill::with(['user', 'pricingPlan']);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('bill_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $bills = $query->orderBy('created_at', 'desc')->paginate(15);

        return view('admin.bills.index', compact('bills'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        $pricingPlans = PricingPlan::where('is_active', true)->orderBy('price')->get();
        return view('admin.bills.create', compact('users', 'pricingPlans'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:1000',
            'status' => 'required|in:pending,paid,failed',
            'due_date' => 'nullable|date|after:today'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        // Get pricing plan to set amount
        $pricingPlan = PricingPlan::findOrFail($request->pricing_plan_id);
        
        $bill = Bill::create([
            'bill_number' => 'BILL-' . strtoupper(uniqid()),
            'user_id' => $request->user_id,
            'pricing_plan_id' => $pricingPlan->id,
            'amount' => $pricingPlan->price,
            'description' => $request->description,
            'status' => $request->status,
            'due_date' => $request->due_date,
        ]);

        return redirect()->route('admin.bills.index')
                        ->with('success', 'Bill created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Bill $bill)
    {
        $bill->load(['user', 'pricingPlan']);
        return view('admin.bills.show', compact('bill'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Bill $bill)
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        $pricingPlans = PricingPlan::where('is_active', true)->orderBy('price')->get();
        return view('admin.bills.edit', compact('bill', 'users', 'pricingPlans'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bill $bill)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:1000',
            'status' => 'required|in:pending,paid,failed',
            'due_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        // Get pricing plan to set amount
        $pricingPlan = PricingPlan::findOrFail($request->pricing_plan_id);
        
        $bill->update([
            'user_id' => $request->user_id,
            'pricing_plan_id' => $pricingPlan->id,
            'amount' => $pricingPlan->price,
            'description' => $request->description,
            'status' => $request->status,
            'due_date' => $request->due_date,
        ]);

        return redirect()->route('admin.bills.index')
                        ->with('success', 'Bill updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bill $bill)
    {
        $bill->delete();

        return redirect()->route('admin.bills.index')
                        ->with('success', 'Bill deleted successfully!');
    }

    /**
     * Mark bill as paid
     */
    public function markAsPaid(Bill $bill)
    {
        $bill->markAsPaid();

        return redirect()->back()
                        ->with('success', 'Bill marked as paid successfully!');
    }

    /**
     * Mark bill as failed
     */
    public function markAsFailed(Bill $bill)
    {
        $bill->markAsFailed();

        return redirect()->back()
                        ->with('success', 'Bill marked as failed successfully!');
    }

    /**
     * Display all transactions (Bills + PayPal Transactions)
     */
    public function transactions(Request $request)
    {
        $query = Bill::with(['user', 'pricingPlan']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('bill_number', 'like', "%{$search}%")
                  ->orWhere('transaction_id', 'like', "%{$search}%")
                  ->orWhere('paypal_order_id', 'like', "%{$search}%")
                  ->orWhere('paypal_capture_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by payment method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(20);

        return view('admin.transactions.index', compact('transactions'));
    }

    /**
     * Show form to create new transaction
     */
    public function createTransaction()
    {
        $users = User::where('role', 'user')->orderBy('name')->get();
        $pricingPlans = PricingPlan::where('is_active', true)->orderBy('price')->get();
        
        return view('admin.transactions.create', compact('users', 'pricingPlans'));
    }

    /**
     * Store new transaction
     */
    public function storeTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'pricing_plan_id' => 'required|exists:pricing_plans,id',
            'description' => 'required|string|max:1000',
            'status' => 'required|in:pending,paid,failed',
            'payment_method' => 'required|in:paypal,bank_transfer,credit_card',
            'transaction_id' => 'nullable|string|max:255',
            'due_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                           ->withErrors($validator)
                           ->withInput();
        }

        // Get pricing plan to set amount
        $pricingPlan = PricingPlan::findOrFail($request->pricing_plan_id);
        $user = User::findOrFail($request->user_id);
        
        $bill = Bill::create([
            'user_id' => $request->user_id,
            'pricing_plan_id' => $pricingPlan->id,
            'amount' => $pricingPlan->price,
            'currency' => 'USD',
            'description' => $request->description,
            'status' => $request->status,
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'due_date' => $request->due_date,
        ]);

        // Process payment based on method and status
        if ($request->status === 'paid') {
            $this->processPaymentByMethod($bill, $request->payment_method, $user, $pricingPlan);
        }

        return redirect()->route('admin.transactions.index')
                        ->with('success', 'Transaction created successfully!');
    }

    /**
     * Process payment based on payment method
     */
    private function processPaymentByMethod(Bill $bill, string $paymentMethod, User $user, PricingPlan $plan)
    {
        switch ($paymentMethod) {
            case 'paypal':
                // For PayPal, the payment is already processed through PayPal API
                // Just add credits and activate plan
                $this->addCreditsToUser($user, $plan);
                $this->activateUserPlan($user, $plan);
                break;
                
            case 'bank_transfer':
            case 'credit_card':
                // For manual payments (bank transfer, credit card), add credits and activate plan
                $this->addCreditsToUser($user, $plan);
                $this->activateUserPlan($user, $plan);
                break;
        }
    }

    /**
     * Add credits to user
     */
    private function addCreditsToUser(User $user, PricingPlan $plan)
    {
        UserCredit::create([
            'user_id' => $user->id,
            'credits' => $plan->credits,
                    'remaining_credits' => $plan->credits,
            'source' => 'purchase',
            'description' => "Credits from {$plan->name} plan purchase",
            'expires_at' => now()->addYear(), // Credits expire after 1 year
        ]);
    }

    /**
     * Activate user plan
     */
    private function activateUserPlan(User $user, PricingPlan $plan)
    {
        $expiryDate = match($plan->billing_cycle) {
            'monthly' => now()->addMonth(),
            'yearly' => now()->addYear(),
            'one_time' => null, // One-time plans don't expire
            default => now()->addMonth()
        };

        $user->update([
            'pricing_plan_id' => $plan->id,
            'plan_expires_at' => $expiryDate,
        ]);
    }

    /**
     * Show transaction details
     */
    public function showTransaction($id)
    {
        $transaction = Bill::with(['user', 'pricingPlan'])->findOrFail($id);
        return view('admin.transactions.show', compact('transaction'));
    }
}

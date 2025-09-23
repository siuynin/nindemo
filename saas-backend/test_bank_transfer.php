<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\PricingPlan;
use App\Models\Bill;
use App\Models\UserCredit;
use Illuminate\Support\Facades\DB;

echo "=== Testing Bank Transfer Payment Logic ===\n";

// Get test data
$user = User::find(3);
$plan = PricingPlan::find(1);

if (!$user || !$plan) {
    echo "Error: User or Plan not found\n";
    exit(1);
}

echo "User: {$user->name} (ID: {$user->id})\n";
echo "Plan: {$plan->name} - Price: \${$plan->price} - Credits: {$plan->credits_included}\n";
echo "User credits before: " . $user->userCredits->sum('remaining_credits') . "\n";
echo "User current plan: " . ($user->pricingPlan ? $user->pricingPlan->name : 'None') . "\n\n";

// Create a paid transaction with Bank Transfer method
echo "Creating paid transaction with Bank Transfer method...\n";

$bill = Bill::create([
    'user_id' => $user->id,
    'pricing_plan_id' => $plan->id,
    'bill_number' => 'BILL-BANK-' . strtoupper(uniqid()),
    'amount' => $plan->price,
    'currency' => 'VND',
    'description' => "Payment for {$plan->name}",
    'status' => 'paid',
    'payment_method' => 'bank_transfer',
    'transaction_id' => 'bank_' . uniqid(),
    'paid_at' => now(),
]);

echo "Bill created: ID {$bill->id}, Status: {$bill->status}\n";

// Process the payment manually (simulate PaymentService logic)
if ($bill->status === 'paid') {
    // Add credits to user
    UserCredit::create([
        'user_id' => $user->id,
        'total_credits' => $plan->credits_included,
        'remaining_credits' => $plan->credits_included,
        'credit_type' => 'purchased',
        'notes' => "Credits from {$plan->name} plan purchase via bank transfer",
        'expires_at' => now()->addYear(), // Credits expire after 1 year
    ]);

    // Activate user plan
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

    echo "Payment processed successfully!\n";
} else {
    echo "Payment processing failed!\n";
}

// Refresh user data
$user->refresh();

echo "\n=== Results ===\n";
echo "User credits after: " . $user->userCredits->sum('remaining_credits') . "\n";
echo "User current plan: " . ($user->pricingPlan ? $user->pricingPlan->name : 'None') . "\n";
echo "Plan expires at: {$user->plan_expires_at}\n";

echo "\nTest completed successfully!\n";
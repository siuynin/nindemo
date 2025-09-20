<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Bill;
use App\Models\User;
use App\Models\UserCredit;
use App\Models\PricingPlan;

echo "=== TEST MANUAL PAYMENT PROCESSING ===" . PHP_EOL . PHP_EOL;

// Lấy bill pending đầu tiên
$bill = Bill::where('status', 'pending')->with('pricingPlan')->first();

if (!$bill) {
    echo "❌ Không có bill pending nào để test" . PHP_EOL;
    exit;
}

echo "📋 THÔNG TIN BILL:" . PHP_EOL;
echo "  - Bill ID: {$bill->id}" . PHP_EOL;
echo "  - User ID: {$bill->user_id}" . PHP_EOL;
echo "  - Amount: \${$bill->amount}" . PHP_EOL;
echo "  - Status: {$bill->status}" . PHP_EOL;
echo "  - Pricing Plan ID: {$bill->pricing_plan_id}" . PHP_EOL;

// Kiểm tra pricing plan
if (!$bill->pricing_plan_id) {
    echo "⚠️  Bill không có pricing_plan_id!" . PHP_EOL;
    
    // Thử gán pricing plan đầu tiên
    $firstPlan = PricingPlan::first();
    if ($firstPlan) {
        echo "🔧 Gán pricing plan đầu tiên (ID: {$firstPlan->id}) cho bill..." . PHP_EOL;
        $bill->update(['pricing_plan_id' => $firstPlan->id]);
        $bill->refresh();
    } else {
        echo "❌ Không có pricing plan nào trong hệ thống!" . PHP_EOL;
        exit;
    }
}

$pricingPlan = $bill->pricingPlan;
if (!$pricingPlan) {
    echo "❌ Không tìm thấy pricing plan!" . PHP_EOL;
    exit;
}

echo "  - Plan Name: {$pricingPlan->name}" . PHP_EOL;
echo "  - Plan Credits: {$pricingPlan->credits}" . PHP_EOL . PHP_EOL;

// Kiểm tra user
$user = User::find($bill->user_id);
if (!$user) {
    echo "❌ Không tìm thấy user!" . PHP_EOL;
    exit;
}

echo "👤 THÔNG TIN USER:" . PHP_EOL;
echo "  - Name: {$user->name}" . PHP_EOL;
echo "  - Email: {$user->email}" . PHP_EOL;
echo "  - Current Credits: " . $user->total_remaining_credits . PHP_EOL . PHP_EOL;

// Simulate payment processing
echo "💳 PROCESSING PAYMENT..." . PHP_EOL;

try {
    // Mark bill as paid
    $bill->update([
        'status' => 'paid',
        'payment_method' => 'manual_test',
        'transaction_id' => 'TEST_' . time(),
        'paid_at' => now()
    ]);
    
    echo "✅ Bill marked as paid" . PHP_EOL;
    
    // Create UserCredit
    if ($pricingPlan->credits > 0) {
        $userCredit = UserCredit::create([
            'user_id' => $user->id,
            'pricing_plan_id' => $pricingPlan->id,
            'total_credits' => $pricingPlan->credits,
            'used_credits' => 0,
            'remaining_credits' => $pricingPlan->credits,
            'expires_at' => now()->addDays(31),
            'credit_type' => 'purchased',
            'notes' => "Manual test payment for {$pricingPlan->name} plan"
        ]);
        
        echo "✅ UserCredit created (ID: {$userCredit->id})" . PHP_EOL;
        echo "  - Credits added: {$pricingPlan->credits}" . PHP_EOL;
        echo "  - Expires at: " . $userCredit->expires_at . PHP_EOL;
        
        // Refresh user to get updated credits
        $user->refresh();
        echo "  - User total credits now: " . $user->total_remaining_credits . PHP_EOL;
        
    } else {
        echo "⚠️  Pricing plan has no credits to add" . PHP_EOL;
    }
    
    echo PHP_EOL . "🎉 PAYMENT PROCESSING COMPLETED SUCCESSFULLY!" . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . "=== TEST COMPLETED ===" . PHP_EOL;
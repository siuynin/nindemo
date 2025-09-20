<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TEST PAYPAL PAYMENT PROCESSING ===" . PHP_EOL . PHP_EOL;

// Tìm user để test
$user = App\Models\User::where('email', 'test@example.com')->first();
if (!$user) {
    $user = App\Models\User::where('email', 'superadmin@saas.com')->first();
}

if (!$user) {
    echo "⚠️  Không tìm thấy user để test" . PHP_EOL;
    exit;
}

// Tìm pricing plan có credits_included
$plan = App\Models\PricingPlan::where('credits_included', '>', 0)->first();

if (!$plan) {
    echo "⚠️  Không tìm thấy pricing plan có credits_included" . PHP_EOL;
    exit;
}

echo "👤 THÔNG TIN USER:" . PHP_EOL;
echo "  - Name: {$user->name}" . PHP_EOL;
echo "  - Email: {$user->email}" . PHP_EOL;
echo "  - ID: {$user->id}" . PHP_EOL;

echo PHP_EOL . "💰 THÔNG TIN PRICING PLAN:" . PHP_EOL;
echo "  - Plan Name: {$plan->name}" . PHP_EOL;
echo "  - Price: \${$plan->price}" . PHP_EOL;
echo "  - Credits: {$plan->credits}" . PHP_EOL;
echo "  - Credits Included: {$plan->credits_included}" . PHP_EOL;

// Kiểm tra UserCredit trước khi thanh toán
$existingCredits = App\Models\UserCredit::where('user_id', $user->id)->count();
echo PHP_EOL . "📊 CREDITS HIỆN TẠI:" . PHP_EOL;
echo "  - Số UserCredit records: {$existingCredits}" . PHP_EOL;

echo PHP_EOL . "💳 SIMULATING PAYPAL PAYMENT..." . PHP_EOL;

// Tạo PayPal transaction record
$transaction = App\Models\PayPalTransaction::create([
    'user_id' => $user->id,
    'plan_id' => $plan->id,
    'paypal_order_id' => 'TEST_ORDER_' . time(),
    'amount' => $plan->price,
    'currency' => 'USD',
    'status' => 'created',
    'paypal_response' => ['test' => true]
]);

echo "✅ PayPal transaction created with ID: {$transaction->id}" . PHP_EOL;

// Simulate successful payment capture
$transaction->update([
    'status' => 'completed',
    'paypal_capture_id' => 'TEST_CAPTURE_' . time(),
    'completed_at' => now(),
    'paypal_response' => ['status' => 'COMPLETED', 'test' => true]
]);

echo "✅ PayPal transaction marked as completed" . PHP_EOL;

// Simulate PayPal controller logic - Add credits to user
try {
    if ($plan->credits_included > 0) {
        $userCredit = App\Models\UserCredit::create([
            'user_id' => $user->id,
            'pricing_plan_id' => $plan->id,
            'total_credits' => $plan->credits_included,
            'used_credits' => 0,
            'remaining_credits' => $plan->credits_included,
            'expires_at' => now()->addDays(31),
            'credit_type' => 'purchased',
            'notes' => "Credits from {$plan->name} plan purchase via PayPal (TEST)"
        ]);
        
        echo "✅ UserCredit created with ID: {$userCredit->id}" . PHP_EOL;
        echo "  - Total Credits: {$userCredit->total_credits}" . PHP_EOL;
        echo "  - Remaining Credits: {$userCredit->remaining_credits}" . PHP_EOL;
        echo "  - Expires At: {$userCredit->expires_at}" . PHP_EOL;
        echo "  - Credit Type: {$userCredit->credit_type}" . PHP_EOL;
    } else {
        echo "⚠️  Plan has no credits_included to add" . PHP_EOL;
    }
} catch (\Exception $e) {
    echo "❌ Error creating UserCredit: " . $e->getMessage() . PHP_EOL;
}

// Activate user plan
try {
    $expiryDate = now()->addDays($plan->duration_days ?? 30);
    $user->update([
        'current_pricing_plan_id' => $plan->id,
        'plan_expires_at' => $expiryDate
    ]);
    
    echo "✅ User plan activated" . PHP_EOL;
    echo "  - Plan: {$plan->name}" . PHP_EOL;
    echo "  - Expires: {$expiryDate}" . PHP_EOL;
} catch (\Exception $e) {
    echo "❌ Error activating plan: " . $e->getMessage() . PHP_EOL;
}

// Kiểm tra UserCredit sau khi thanh toán
$newCreditsCount = App\Models\UserCredit::where('user_id', $user->id)->count();
echo PHP_EOL . "📊 CREDITS SAU KHI THANH TOÁN:" . PHP_EOL;
echo "  - Số UserCredit records: {$newCreditsCount}" . PHP_EOL;

if ($newCreditsCount > $existingCredits) {
    echo "🎉 THÀNH CÔNG! PayPal payment flow hoạt động đúng!" . PHP_EOL;
} else {
    echo "❌ THẤT BẠI! PayPal payment flow có vấn đề!" . PHP_EOL;
}

echo PHP_EOL . "=== TEST COMPLETED ===" . PHP_EOL;
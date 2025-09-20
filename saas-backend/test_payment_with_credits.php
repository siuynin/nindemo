<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TEST PAYMENT WITH CREDITS ===" . PHP_EOL . PHP_EOL;

// Tìm bill pending
$bill = App\Models\Bill::where('status', 'pending')->first();

if (!$bill) {
    echo "⚠️  Không có bill pending nào để test" . PHP_EOL;
    exit;
}

echo "📋 THÔNG TIN BILL:" . PHP_EOL;
echo "  - Bill ID: {$bill->id}" . PHP_EOL;
echo "  - User ID: {$bill->user_id}" . PHP_EOL;
echo "  - Amount: \${$bill->amount}" . PHP_EOL;
echo "  - Status: {$bill->status}" . PHP_EOL;
echo "  - Pricing Plan ID: {$bill->pricing_plan_id}" . PHP_EOL;

// Nếu bill chưa có pricing_plan_id, gán plan có credits_included
if (!$bill->pricing_plan_id) {
    $planWithCredits = App\Models\PricingPlan::where('credits_included', '>', 0)->first();
    if ($planWithCredits) {
        $bill->update(['pricing_plan_id' => $planWithCredits->id]);
        echo "🔧 Đã gán pricing plan ID: {$planWithCredits->id} ({$planWithCredits->name})" . PHP_EOL;
    }
}

$user = $bill->user;
$pricingPlan = $bill->pricingPlan;

echo PHP_EOL . "👤 THÔNG TIN USER:" . PHP_EOL;
echo "  - Name: {$user->name}" . PHP_EOL;
echo "  - Email: {$user->email}" . PHP_EOL;

echo PHP_EOL . "💰 THÔNG TIN PRICING PLAN:" . PHP_EOL;
echo "  - Plan Name: {$pricingPlan->name}" . PHP_EOL;
echo "  - Credits: {$pricingPlan->credits}" . PHP_EOL;
echo "  - Credits Included: {$pricingPlan->credits_included}" . PHP_EOL;

// Kiểm tra UserCredit trước khi thanh toán
$existingCredits = App\Models\UserCredit::where('user_id', $user->id)->count();
echo PHP_EOL . "📊 CREDITS HIỆN TẠI:" . PHP_EOL;
echo "  - Số UserCredit records: {$existingCredits}" . PHP_EOL;

echo PHP_EOL . "💳 PROCESSING PAYMENT..." . PHP_EOL;

// Mark bill as paid
$bill->update(['status' => 'paid', 'paid_at' => now()]);
echo "✅ Bill marked as paid" . PHP_EOL;

// Update user subscription
$user->update([
    'subscription_plan' => $pricingPlan->name,
    'subscription_expires_at' => now()->addMonth()
]);
echo "✅ User subscription updated" . PHP_EOL;

// Thêm credits cho user từ pricing plan (sử dụng logic đã sửa)
if ($pricingPlan && $pricingPlan->credits_included > 0) {
    $userCredit = App\Models\UserCredit::create([
        'user_id' => $user->id,
        'pricing_plan_id' => $pricingPlan->id,
        'total_credits' => $pricingPlan->credits_included,
        'used_credits' => 0,
        'remaining_credits' => $pricingPlan->credits_included,
        'expires_at' => now()->addDays(31),
        'credit_type' => 'purchased',
        'notes' => "Credits from {$pricingPlan->name} plan purchase via test"
    ]);
    
    echo "✅ UserCredit created with ID: {$userCredit->id}" . PHP_EOL;
    echo "  - Total Credits: {$userCredit->total_credits}" . PHP_EOL;
    echo "  - Remaining Credits: {$userCredit->remaining_credits}" . PHP_EOL;
    echo "  - Expires At: {$userCredit->expires_at}" . PHP_EOL;
} else {
    echo "⚠️  Pricing plan has no credits_included to add" . PHP_EOL;
}

// Kiểm tra UserCredit sau khi thanh toán
$newCreditsCount = App\Models\UserCredit::where('user_id', $user->id)->count();
echo PHP_EOL . "📊 CREDITS SAU KHI THANH TOÁN:" . PHP_EOL;
echo "  - Số UserCredit records: {$newCreditsCount}" . PHP_EOL;

if ($newCreditsCount > $existingCredits) {
    echo "🎉 THÀNH CÔNG! UserCredit đã được tạo!" . PHP_EOL;
} else {
    echo "❌ THẤT BẠI! UserCredit không được tạo!" . PHP_EOL;
}

echo PHP_EOL . "=== TEST COMPLETED ===" . PHP_EOL;
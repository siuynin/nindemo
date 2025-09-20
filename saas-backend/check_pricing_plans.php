<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== KIỂM TRA PRICING PLANS ===" . PHP_EOL . PHP_EOL;

$plans = App\Models\PricingPlan::all();

if ($plans->count() > 0) {
    echo "📋 DANH SÁCH PRICING PLANS:" . PHP_EOL;
    foreach ($plans as $plan) {
        echo "  Plan ID: {$plan->id}" . PHP_EOL;
        echo "    - Name: {$plan->name}" . PHP_EOL;
        echo "    - Price: \${$plan->price}" . PHP_EOL;
        echo "    - Credits: {$plan->credits}" . PHP_EOL;
        echo "    - Credits Included: {$plan->credits_included}" . PHP_EOL;
        echo "    - Status: {$plan->status}" . PHP_EOL;
        echo "    - Is Active: " . ($plan->is_active ? 'Yes' : 'No') . PHP_EOL;
        echo "    ---" . PHP_EOL;
    }
    
    // Kiểm tra plan nào có credits > 0
    $plansWithCredits = $plans->where('credits', '>', 0);
    $plansWithCreditsIncluded = $plans->where('credits_included', '>', 0);
    
    echo PHP_EOL . "📊 THỐNG KÊ:" . PHP_EOL;
    echo "  - Tổng số plans: {$plans->count()}" . PHP_EOL;
    echo "  - Plans có credits > 0: {$plansWithCredits->count()}" . PHP_EOL;
    echo "  - Plans có credits_included > 0: {$plansWithCreditsIncluded->count()}" . PHP_EOL;
    
    if ($plansWithCreditsIncluded->count() > 0) {
        echo PHP_EOL . "💰 PLANS CÓ CREDITS_INCLUDED:" . PHP_EOL;
        foreach ($plansWithCreditsIncluded as $plan) {
            echo "  - {$plan->name}: {$plan->credits_included} credits" . PHP_EOL;
        }
    }
    
} else {
    echo "⚠️  Không có pricing plan nào trong hệ thống" . PHP_EOL;
}

echo PHP_EOL . "=== KẾT THÚC KIỂM TRA ===" . PHP_EOL;
<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PricingPlan;

echo "Current pricing plans:\n";
$plans = PricingPlan::all();
foreach ($plans as $plan) {
    echo "- {$plan->name}: billing_cycle = {$plan->billing_cycle}\n";
}

echo "\nTesting creation with billing_cycle...\n";
try {
    $newPlan = PricingPlan::create([
        'name' => 'Test Plan',
        'description' => 'Test description',
        'price' => 100000,
        'currency' => 'VND',
        'credits' => 1000,
        'billing_cycle' => 'monthly',
        'status' => 'active',
        'max_voice_clone' => 5,
        'sort_order' => 99,
        'feature_list' => ['Feature 1', 'Feature 2']
    ]);
    echo "✓ Successfully created plan: {$newPlan->name}\n";
    echo "  Billing cycle: {$newPlan->billing_cycle}\n";
    
    // Clean up
    $newPlan->delete();
    echo "✓ Test plan deleted\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
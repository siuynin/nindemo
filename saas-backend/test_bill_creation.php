<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TEST BILL CREATION ===" . PHP_EOL . PHP_EOL;

try {
    echo "📋 Testing bill creation..." . PHP_EOL;
    
    $bill = App\Models\Bill::create([
        'user_id' => 1,
        'amount' => 10.00,
        'currency' => 'VND',
        'status' => 'pending',
        'payment_method' => 'bank_transfer'
    ]);
    
    echo "✅ Success! New bill created:" . PHP_EOL;
    echo "  - Bill ID: {$bill->id}" . PHP_EOL;
    echo "  - Bill Number: {$bill->bill_number}" . PHP_EOL;
    echo "  - Amount: {$bill->amount} {$bill->currency}" . PHP_EOL;
    echo "  - Status: {$bill->status}" . PHP_EOL;
    echo "  - Created at: {$bill->created_at}" . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ Error creating bill: " . $e->getMessage() . PHP_EOL;
    echo "Error details: " . $e->getTraceAsString() . PHP_EOL;
}

echo PHP_EOL . "=== DONE ===" . PHP_EOL;
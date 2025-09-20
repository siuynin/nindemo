<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo 'Total UserCredit records: ' . App\Models\UserCredit::count() . PHP_EOL;
echo 'UserCredit records for user 2: ' . App\Models\UserCredit::where('user_id', 2)->count() . PHP_EOL;

$credits = App\Models\UserCredit::where('user_id', 2)->get();
foreach($credits as $credit) {
    echo 'Credit ID: ' . $credit->id . ', Total: ' . $credit->total_credits . ', Remaining: ' . $credit->remaining_credits . ', Expires: ' . $credit->expires_at . PHP_EOL;
}

// Check all UserCredit records
echo "\nAll UserCredit records:" . PHP_EOL;
$allCredits = App\Models\UserCredit::all();
foreach($allCredits as $credit) {
    echo 'User ID: ' . $credit->user_id . ', Credit ID: ' . $credit->id . ', Total: ' . $credit->total_credits . ', Remaining: ' . $credit->remaining_credits . ', Expires: ' . $credit->expires_at . PHP_EOL;
}
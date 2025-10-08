<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\UserCredit;

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    // Get first user
    $user = User::first();
    
    if (!$user) {
        echo "No user found in database\n";
        exit(1);
    }
    
    // Check if user already has credits
    $existingCredit = UserCredit::where('user_id', $user->id)->first();
    
    if ($existingCredit) {
        echo "User already has credits: " . $existingCredit->remaining_credits . "\n";
        exit(0);
    }
    
    // Create user credit
    $userCredit = UserCredit::create([
        'user_id' => $user->id,
        'total_credits' => 1000,
        'used_credits' => 0,
        'remaining_credits' => 1000,
        'expires_at' => now()->addYear(),
        'credit_type' => 'free'
    ]);
    
    echo "User credit created successfully for user: " . $user->name . "\n";
    echo "Credits: " . $userCredit->remaining_credits . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
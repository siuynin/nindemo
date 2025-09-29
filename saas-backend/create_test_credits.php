<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating test credits for user...\n";

// Get a user
$user = \App\Models\User::where('role', 'user')->first();
if (!$user) {
    echo "No user found!\n";
    exit;
}

echo "Creating credits for user: {$user->name} (ID: {$user->id})\n";

// Create a credit record
$credit = new \App\Models\UserCredit();
$credit->user_id = $user->id;
$credit->pricing_plan_id = null; // No specific plan
$credit->total_credits = 5000;
$credit->used_credits = 0;
$credit->remaining_credits = 5000;
$credit->expires_at = now()->addMonths(1); // Expires in 1 month
$credit->credit_type = 'bonus';
$credit->save();

echo "Created credit record with ID: {$credit->id}\n";
echo "Total credits: {$credit->total_credits}\n";
echo "Remaining credits: {$credit->remaining_credits}\n";
echo "Expires at: {$credit->expires_at}\n";

// Verify total remaining credits
$totalRemaining = $user->fresh()->total_remaining_credits;
echo "User's total remaining credits: {$totalRemaining}\n";

echo "Test credits created successfully!\n";
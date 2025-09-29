<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking user credits...\n\n";

// Get the first user
$user = \App\Models\User::first();
if (!$user) {
    echo "No user found!\n";
    exit;
}

echo "User: {$user->name} (ID: {$user->id})\n";
echo "Email: {$user->email}\n\n";

// Check if user has 'credit' column (old system)
$userTable = \Illuminate\Support\Facades\Schema::getColumnListing('users');
if (in_array('credit', $userTable)) {
    echo "Old credit system (users.credit): {$user->credit}\n";
} else {
    echo "Old credit system: Column 'credit' not found in users table\n";
}

// Check new credit system
$totalRemainingCredits = $user->total_remaining_credits;
echo "New credit system (total_remaining_credits): {$totalRemainingCredits}\n\n";

// Show all user credits
$userCredits = $user->credits()->get();
echo "User Credits Records:\n";
echo "ID\tTotal\tUsed\tRemaining\tExpires\t\tStatus\n";
echo "-----------------------------------------------------------\n";

foreach ($userCredits as $credit) {
    $status = 'Active';
    if ($credit->expires_at && $credit->expires_at->isPast()) {
        $status = 'Expired';
    } elseif ($credit->remaining_credits <= 0) {
        $status = 'Used Up';
    }
    
    $expiresAt = $credit->expires_at ? $credit->expires_at->format('Y-m-d H:i') : 'Never';
    
    echo "{$credit->id}\t{$credit->total_credits}\t{$credit->used_credits}\t{$credit->remaining_credits}\t\t{$expiresAt}\t{$status}\n";
}

if ($userCredits->isEmpty()) {
    echo "No credit records found for this user.\n";
}

echo "\nActive Credits (not expired, remaining > 0):\n";
$activeCredits = $user->activeCredits()->get();
foreach ($activeCredits as $credit) {
    echo "- Credit ID {$credit->id}: {$credit->remaining_credits} credits (expires: {$credit->expires_at->format('Y-m-d H:i')})\n";
}

if ($activeCredits->isEmpty()) {
    echo "No active credits found.\n";
}

echo "\nSummary:\n";
echo "- Total remaining credits (calculated): {$totalRemainingCredits}\n";
echo "- Active credits count: " . $activeCredits->count() . "\n";
<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating token for user...\n";

$user = \App\Models\User::where('role', 'user')->first();
if (!$user) {
    echo "No user found!\n";
    exit;
}

$token = $user->createToken('frontend_test')->plainTextToken;
echo "Token for user {$user->name}: {$token}\n";
echo "User ID: {$user->id}\n";
echo "User email: {$user->email}\n";

// Check user credits
$totalCredits = $user->total_remaining_credits;
echo "Total remaining credits: {$totalCredits}\n";
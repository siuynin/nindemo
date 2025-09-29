<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Credit API...\n";

// Get a user with credits
$user = \App\Models\User::where('role', 'user')->first();
if (!$user) {
    echo "No user found!\n";
    exit;
}

echo "Testing with user: {$user->name} (ID: {$user->id})\n";

// Check user's credits directly from database
$userCredits = $user->credits()->get();
echo "User credits from database:\n";
foreach ($userCredits as $credit) {
    echo "  - Credit ID: {$credit->id}, Total: {$credit->total_credits}, Used: {$credit->used_credits}, Remaining: {$credit->remaining_credits}\n";
}

$totalRemaining = $user->total_remaining_credits;
echo "Total remaining credits: {$totalRemaining}\n";

// Test the API endpoint directly
echo "\nTesting API endpoint /user/credits...\n";

// Create a token for the user
$token = $user->createToken('test_token')->plainTextToken;
echo "Created token: {$token}\n";

// Make API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8001/api/user/credits');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n";

// Parse response
$data = json_decode($response, true);
if ($data) {
    echo "\nParsed response:\n";
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    if (isset($data['data']['total_remaining'])) {
        echo "Total remaining from API: {$data['data']['total_remaining']}\n";
    } else {
        echo "total_remaining not found in response!\n";
        echo "Available keys in data: " . implode(', ', array_keys($data['data'] ?? [])) . "\n";
    }
}

// Clean up token
$user->tokens()->delete();
echo "\nToken cleaned up.\n";
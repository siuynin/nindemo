<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Find user with ID 2
$user = App\Models\User::find(2);

if ($user) {
    // Create a token for this user
    $token = $user->createToken('debug-token')->plainTextToken;
    
    echo "Token for user {$user->name} (ID: {$user->id}): " . $token . "\n";
    echo "Email: {$user->email}\n";
} else {
    echo "User with ID 2 not found\n";
}
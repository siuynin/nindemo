<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::first();

if ($user) {
    $token = $user->createToken('test-token')->plainTextToken;
    echo "Token: " . $token . PHP_EOL;
    echo "User ID: " . $user->id . PHP_EOL;
    echo "User Email: " . $user->email . PHP_EOL;
} else {
    echo "No user found" . PHP_EOL;
}
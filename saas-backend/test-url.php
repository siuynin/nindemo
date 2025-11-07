<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "APP_URL from config: " . config('app.url') . "\n";
echo "APP_URL from env: " . env('APP_URL') . "\n";

// Test URL generation
$testUrl = url('test/path');
echo "Generated URL: " . $testUrl . "\n";

// Test with explicit domain
$urlWithDomain = url('uploads/test.jpg');
echo "URL with domain: " . $urlWithDomain . "\n";
<?php

// Test script to verify URL generation with the tunnel
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== URL Generation Test ===\n";
echo "APP_URL from config: " . config('app.url') . "\n";
echo "Current APP_URL from env: " . env('APP_URL') . "\n\n";

// Test url() helper
echo "Testing url() helper:\n";
echo "url('/test'): " . url('/test') . "\n";
echo "url('uploads/runninghub-inputs/test.jpg'): " . url('uploads/runninghub-inputs/test.jpg') . "\n\n";

// Test with relative paths
$relativePath = 'uploads/runninghub-inputs/test-image.jpg';
echo "Relative path: $relativePath\n";
echo "Generated URL: " . url($relativePath) . "\n\n";

echo "=== Environment Check ===\n";
echo "App environment: " . config('app.env') . "\n";
echo "App debug: " . (config('app.debug') ? 'true' : 'false') . "\n";

echo "\n=== RunningHub Service Test ===\n";
// Test if we can instantiate the service
try {
    $runningHubService = app(\App\Services\RunningHubImageService::class);
    $config = $runningHubService->getConfig();
    echo "RunningHub Service Config:\n";
    echo "- API Key: " . $config['api_key'] . "\n";
    echo "- Base URL: " . $config['base_url'] . "\n";
    echo "- WebApp ID: " . $config['webapp_id'] . "\n";
} catch (Exception $e) {
    echo "Error creating RunningHub service: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
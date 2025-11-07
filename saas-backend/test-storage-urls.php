<?php

// Test script to verify storage URL generation
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Storage URL Generation Test ===\n\n";

echo "1. Environment Configuration:\n";
echo "APP_URL from config: " . config('app.url') . "\n";
echo "APP_URL from env: " . env('APP_URL') . "\n";
echo "Filesystem public disk URL: " . config('filesystems.disks.public.url') . "\n\n";

echo "2. Testing Storage URL Generation:\n";

// Test with Storage facade
use Illuminate\Support\Facades\Storage;

$testPath = 'runninghub-inputs/test-image.jpg';
$storageUrl = Storage::disk('public')->url($testPath);
echo "Storage::disk('public')->url('$testPath'):\n";
echo "Result: $storageUrl\n\n";

echo "3. Testing Laravel url() Helper:\n";
$laravelUrl = url('storage/' . $testPath);
echo "url('storage/$testPath'):\n";
echo "Result: $laravelUrl\n\n";

echo "4. Testing Custom URL Generation:\n";
$customUrl = config('app.url') . '/storage/' . $testPath;
echo "Manual URL construction:\n";
echo "Result: $customUrl\n\n";

echo "5. Testing ImageStorageService:\n";
try {
    $imageStorageService = app(\App\Services\ImageStorageService::class);
    
    // Test the uploadImageFromUrlToLocalPublic method
    $testImageUrl = 'https://via.placeholder.com/150';
    echo "Testing uploadImageFromUrlToLocalPublic with: $testImageUrl\n";
    
    $result = $imageStorageService->uploadImageFromUrlToLocalPublic($testImageUrl, 'runninghub-inputs');
    echo "Result:\n";
    echo "URL: {$result['url']}\n";
    echo "Path: {$result['path']}\n";
    
    // Check if it uses the tunnel domain
    if (str_contains($result['url'], 'serveo.net')) {
        echo "✅ SUCCESS: Uses tunnel domain!\n";
    } else {
        echo "❌ ISSUE: Does not use tunnel domain\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
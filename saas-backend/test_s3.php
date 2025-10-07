<?php

require_once 'vendor/autoload.php';

// Load Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\ImageStorageService;
use Illuminate\Support\Facades\Log;

echo "=== S3 Configuration Test ===\n";

$service = new ImageStorageService();

echo "S3 Configured: " . ($service->isS3Configured() ? 'YES' : 'NO') . "\n";
print_r($service->getS3Status());

echo "\n=== Testing S3 Upload ===\n";

// Test URL from Runware
$testUrl = 'https://im.runware.ai/image/ws/2/ii/11955703-497c-467e-ac89-bbc73ff25b0f.jpg';

try {
    echo "Attempting to upload: $testUrl\n";
    $result = $service->uploadImageFromUrl($testUrl, 'test-images');
    echo "Upload successful! S3 URL: $result\n";
} catch (Exception $e) {
    echo "Upload failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Testing Multiple Upload ===\n";

try {
    $urls = [$testUrl];
    echo "Attempting to upload multiple images...\n";
    $result = $service->uploadMultipleImagesFromUrls($urls, 'test-images');
    echo "Multiple upload result:\n";
    print_r($result);
} catch (Exception $e) {
    echo "Multiple upload failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
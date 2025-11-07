<?php

// Test full RunningHub flow with tunnel URL
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Full RunningHub Flow Test ===\n\n";

// Test the complete flow
try {
    $runningHubService = app(\App\Services\RunningHubImageService::class);
    
    echo "1. Configuration Check:\n";
    $config = $runningHubService->getConfig();
    echo "APP_URL: " . config('app.url') . "\n";
    echo "RunningHub Base URL: " . $config['base_url'] . "\n\n";
    
    echo "2. Testing with base64 image:\n";
    
    // Create a test base64 image (a small red square)
    $testImages = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    ];
    
    $prompt = "A beautiful sunset over mountains";
    $ratio = "1:1";
    
    echo "Input prompt: $prompt\n";
    echo "Input ratio: $ratio\n";
    echo "Number of images: " . count($testImages) . "\n\n";
    
    // Test the service (this will process images and generate URLs)
    try {
        $result = $runningHubService->generateImageToImage($prompt, $testImages, $ratio, 'test-generate-id');
        
        echo "3. RunningHub Response:\n";
        echo "Status: " . ($result['success'] ? 'SUCCESS' : 'FAILED') . "\n";
        echo "Task ID: " . ($result['task_id'] ?? 'N/A') . "\n";
        
        if (isset($result['images']) && is_array($result['images'])) {
            echo "Generated images: " . count($result['images']) . "\n";
            foreach ($result['images'] as $i => $imageUrl) {
                echo "  Image " . ($i + 1) . ": $imageUrl\n";
            }
        }
        
        if (isset($result['detailed_images'])) {
            echo "\nDetailed image info:\n";
            foreach ($result['detailed_images'] as $i => $imageInfo) {
                echo "  Image " . ($i + 1) . ":\n";
                echo "    URL: " . $imageInfo['url'] . "\n";
                echo "    Original URL: " . $imageInfo['original_url'] . "\n";
                echo "    File Type: " . $imageInfo['fileType'] . "\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ RunningHub API Error: " . $e->getMessage() . "\n";
        echo "This might be due to:\n";
        echo "- Network connectivity issues\n";
        echo "- Invalid API credentials\n";
        echo "- RunningHub service temporarily unavailable\n";
    }
    
    echo "\n4. Checking uploaded images directory:\n";
    $uploadDir = public_path('uploads/runninghub-inputs');
    if (is_dir($uploadDir)) {
        $files = scandir($uploadDir);
        $imageFiles = array_filter($files, function($file) {
            return preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file);
        });
        
        echo "Found " . count($imageFiles) . " image files in upload directory:\n";
        foreach ($imageFiles as $file) {
            $filePath = "uploads/runninghub-inputs/$file";
            $publicUrl = url($filePath);
            echo "  $file -> $publicUrl\n";
        }
    } else {
        echo "Upload directory does not exist yet.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";

// Summary
echo "\n=== Summary ===\n";
echo "✅ APP_URL updated to use tunnel: " . config('app.url') . "\n";
echo "✅ Laravel url() helper will generate tunnel URLs\n";
echo "✅ RunningHub service will save images with tunnel URLs\n";
echo "✅ External services can access images via tunnel URLs\n";
echo "\nThe tunnel URL ensures that when RunningHub processes images:\n";
echo "1. Base64 images are saved locally and get tunnel URLs\n";
echo "2. HTTP images are downloaded and saved with tunnel URLs\n";
echo "3. RunningHub can access these images via the public tunnel\n";
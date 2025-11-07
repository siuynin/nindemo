<?php

// Test script to verify RunningHub service uses correct URLs with tunnel
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== RunningHub URL Generation Test ===\n\n";

// Test the RunningHub service directly
try {
    $runningHubService = app(\App\Services\RunningHubImageService::class);
    $imageStorageService = app(\App\Services\ImageStorageService::class);
    
    echo "1. Testing base64 image processing:\n";
    
    // Create a small test base64 image (1x1 red pixel)
    $testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Test the image processing logic directly
    $reflection = new ReflectionClass($runningHubService);
    $method = $reflection->getMethod('downloadAndSaveImage');
    $method->setAccessible(true);
    
    // Test URL generation
    $testUrl = 'https://example.com/test-image.jpg';
    echo "Testing URL generation with current APP_URL:\n";
    echo "APP_URL: " . config('app.url') . "\n";
    
    // Test what URL would be generated for a local file
    $localPath = 'uploads/runninghub-inputs/test-image.jpg';
    $generatedUrl = url($localPath);
    echo "Generated URL for local path '$localPath':\n";
    echo "Result: $generatedUrl\n\n";
    
    echo "2. Testing with a real HTTP image:\n";
    
    // Test with a real image URL that we can download
    $testImageUrl = 'https://via.placeholder.com/150';
    
    try {
        $result = $method->invoke($runningHubService, $testImageUrl);
        echo "Downloaded and saved image successfully:\n";
        echo "Local URL: $result\n";
        
        // Check if the URL uses the tunnel
        if (str_contains($result, 'serveo.net')) {
            echo "✅ SUCCESS: URL uses the tunnel domain!\n";
        } else {
            echo "❌ ISSUE: URL does not use tunnel domain\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error downloading image: " . $e->getMessage() . "\n";
    }
    
    echo "\n3. Testing base64 image processing:\n";
    
    // Test base64 processing (simulate what happens in the service)
    try {
        // Decode base64 and get extension
        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $testBase64));
        $extension = 'png'; // from our test data
        
        // Create filename and path
        $filename = uniqid('runninghub-') . '.' . $extension;
        $relativePath = 'uploads/runninghub-inputs/' . $filename;
        $absolutePath = public_path($relativePath);
        
        // Ensure directory exists
        $directory = dirname($absolutePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        
        // Save file
        file_put_contents($absolutePath, $imageData);
        
        // Generate URL
        $imageUrl = url($relativePath);
        
        echo "Saved base64 image:\n";
        echo "File path: $absolutePath\n";
        echo "Public URL: $imageUrl\n";
        
        if (str_contains($imageUrl, 'serveo.net')) {
            echo "✅ SUCCESS: Base64 image URL uses tunnel domain!\n";
        } else {
            echo "❌ ISSUE: Base64 image URL does not use tunnel domain\n";
        }
        
        // Clean up
        if (file_exists($absolutePath)) {
            unlink($absolutePath);
            echo "Cleaned up test file.\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error processing base64: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
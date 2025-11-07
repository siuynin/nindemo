<?php

// Test script for RunningHubImageService

require_once __DIR__ . '/saas-backend/vendor/autoload.php';

use App\Services\RunningHubImageService;

// Create service instance
$service = new RunningHubImageService();

echo "Testing RunningHubImageService...\n";
echo "API Key: " . substr($service->getApiKey(), 0, 10) . "...\n";
echo "WebApp ID: " . $service->getWebAppId() . "\n";
echo "Base URL: " . $service->getBaseUrl() . "\n";

// Test with a simple prompt and image
$prompt = "A beautiful sunset over mountains";
$image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";
$ratio = "16:9";

echo "\nTesting image-to-image generation...\n";
echo "Prompt: {$prompt}\n";
echo "Ratio: {$ratio}\n";

try {
    $result = $service->generateImageToImage($prompt, $image, $ratio, 'test-generate-id');
    
    if (isset($result['images']) && !empty($result['images'])) {
        echo "✅ Success! Generated " . count($result['images']) . " images\n";
        foreach ($result['images'] as $index => $image) {
            echo "Image " . ($index + 1) . ": " . $image['url'] . "\n";
        }
    } else {
        echo "❌ No images generated\n";
        echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";
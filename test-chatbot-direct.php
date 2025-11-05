<?php

// Test chatbot API với token thực tế
$token = 'P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df';

// Test các prompt khác nhau
$testPrompts = [
    "tạo prompt video 2 người cãi nhau",
    "xin chào",
    "thời tiết hôm nay thế nào",
    "giúp tôi viết một đoạn văn ngắn"
];

echo "=== TEST CHATBOT API ===\n";
echo "Token: $token\n\n";

foreach ($testPrompts as $prompt) {
    echo "Testing prompt: '$prompt'\n";
    echo str_repeat("-", 50) . "\n";
    
    // Test với Gemini
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8001/api/ai/process-text-gemini');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'prompt' => $prompt,
        'model' => 'gemini-2.5-flash',
        'max_tokens' => 500,
        'temperature' => 0.7
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Gemini Response:\n";
    echo "HTTP Code: $httpCode\n";
    
    if ($response) {
        $data = json_decode($response, true);
        if (isset($data['success']) && $data['success']) {
            echo "Success: YES\n";
            echo "Text: " . ($data['data']['text'] ?? 'EMPTY') . "\n";
        } else {
            echo "Success: NO\n";
            echo "Error: " . ($data['error'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "No response received\n";
    }
    
    echo "\n";
}
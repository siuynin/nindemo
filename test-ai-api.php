<?php
// Test script to check AI API endpoints

$endpoints = [
    'process-text' => 'http://127.0.0.1:8001/api/ai/process-text',
    'process-text-gemini' => 'http://127.0.0.1:8001/api/ai/process-text-gemini'
];

$testPrompt = "tạo prompt video 2 cãi nhau";

foreach ($endpoints as $name => $url) {
    echo "Testing $name endpoint...\n";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer test-token-123'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'prompt' => $testPrompt,
        'model' => ($name === 'process-text' ? 'gpt-4.1-mini' : 'gemini-2.5-flash'),
        'max_tokens' => 500,
        'temperature' => 0.7
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: " . substr($response, 0, 500) . "...\n\n";
}
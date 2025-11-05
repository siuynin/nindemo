<?php
// Test chatbot API với token thực tế

$token = '2s|P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df'; // Token mặc định nếu cần
$apiUrl = 'http://127.0.0.1:8001/api/ai/process-text';

// Test với prompt nhạy cảm
$testPrompts = [
    "tạo prompt video 2 người cãi nhau",
    "viết một đoạn văn ngắn về thời tiết hôm nay",
    "hello"
];

echo "Testing Chatbot API with Gemini...\n";
echo "=====================================\n\n";

foreach ($testPrompts as $prompt) {
    echo "Testing prompt: \"$prompt\"\n";
    
    $payload = json_encode([
        'prompt' => $prompt,
        'model' => 'gemini-2.5-flash',
        'max_tokens' => 500,
        'temperature' => 0.7
    ]);
    
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    
    if ($error) {
        echo "CURL Error: $error\n";
    } else {
        $data = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
            
            if (isset($data['success']) && $data['success'] && isset($data['data']['text'])) {
                echo "✅ SUCCESS: " . $data['data']['text'] . "\n";
            } else {
                echo "❌ FAILED: " . ($data['error'] ?? 'No text in response') . "\n";
            }
        } else {
            echo "Raw Response: $response\n";
        }
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
    sleep(1); // Tránh rate limiting
}

echo "Testing completed!\n";
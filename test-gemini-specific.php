<?php

$token = 'P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df';
$baseUrl = 'http://127.0.0.1:8001';

echo "Testing Gemini với prompt cụ thể\n";
echo "========================================\n\n";

// Test với prompt cụ thể bạn nói
$prompt = "tạo prompt video 2 người cãi nhau";
$geminiData = [
    'prompt' => $prompt,
    'model' => 'gemini-2.5-flash',
    'max_tokens' => 500,
    'temperature' => 0.7
];

echo "Prompt: $prompt\n";
echo "1. Testing Gemini endpoint:\n";
$ch = curl_init($baseUrl . '/api/ai/process-text-gemini');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($geminiData));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Raw Response: $response\n\n";

// Decode để xem chi tiết
$data = json_decode($response, true);
if (isset($data['data']['text'])) {
    echo "Text content: \"" . $data['data']['text'] . "\"\n";
    echo "Text length: " . strlen($data['data']['text']) . " characters\n";
} else {
    echo "No text content found\n";
}

if (isset($data['data']['usage'])) {
    echo "Usage: " . json_encode($data['data']['usage']) . "\n";
}

echo "\n========================================\n";

// Test với prompt an toàn hơn
$safePrompt = "viết một đoạn văn ngắn về thời tiết hôm nay";
$safeData = [
    'prompt' => $safePrompt,
    'model' => 'gemini-2.5-flash',
    'max_tokens' => 200,
    'temperature' => 0.7
];

echo "2. Testing với prompt an toàn:\n";
echo "Prompt: $safePrompt\n";

$ch2 = curl_init($baseUrl . '/api/ai/process-text-gemini');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($safeData));

$response2 = curl_exec($ch2);
curl_close($ch2);

echo "Response: $response2\n\n";

$data2 = json_decode($response2, true);
if (isset($data2['data']['text'])) {
    echo "Text content: \"" . $data2['data']['text'] . "\"\n";
    echo "Text length: " . strlen($data2['data']['text']) . " characters\n";
}
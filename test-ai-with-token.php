<?php

$token = 'P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df';
$baseUrl = 'http://127.0.0.1:8001';

echo "Testing AI API with token: $token\n";
echo "========================================\n\n";

// Test OpenAI endpoint
$openaiData = [
    'prompt' => 'Hello, how are you?',
    'model' => 'gpt-3.5-turbo',
    'max_tokens' => 100,
    'temperature' => 0.7
];

echo "1. Testing OpenAI endpoint (/api/ai/process-text):\n";
$ch1 = curl_init($baseUrl . '/api/ai/process-text');
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch1, CURLOPT_POST, true);
curl_setopt($ch1, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch1, CURLOPT_POSTFIELDS, json_encode($openaiData));

$response1 = curl_exec($ch1);
$httpCode1 = curl_getinfo($ch1, CURLINFO_HTTP_CODE);
$error1 = curl_error($ch1);
curl_close($ch1);

echo "HTTP Code: $httpCode1\n";
if ($error1) {
    echo "cURL Error: $error1\n";
} else {
    echo "Response: $response1\n";
}
echo "\n";

// Test Gemini endpoint
$geminiData = [
    'prompt' => 'Hello, how are you?',
    'model' => 'gemini-pro',
    'max_tokens' => 100,
    'temperature' => 0.7
];

echo "2. Testing Gemini endpoint (/api/ai/process-text-gemini):\n";
$ch2 = curl_init($baseUrl . '/api/ai/process-text-gemini');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($geminiData));

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
$error2 = curl_error($ch2);
curl_close($ch2);

echo "HTTP Code: $httpCode2\n";
if ($error2) {
    echo "cURL Error: $error2\n";
} else {
    echo "Response: $response2\n";
}
echo "\n";

// Test user endpoint to verify token
$ch3 = curl_init($baseUrl . '/api/user');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);

echo "3. Testing user endpoint (/api/user) to verify token:\n";
echo "HTTP Code: $httpCode3\n";
echo "Response: $response3\n";
echo "\n";

echo "========================================\n";
echo "Test completed!\n";
<?php

$token = 'P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df';
$baseUrl = 'http://127.0.0.1:8001';

echo "Testing AI API with FIXED models\n";
echo "========================================\n\n";

// Test OpenAI endpoint với model hợp lệ
$openaiData = [
    'prompt' => 'Hello, how are you?',
    'model' => 'gpt-4.1-mini', // Model hợp lệ
    'max_tokens' => 100,
    'temperature' => 0.7
];

echo "1. Testing OpenAI endpoint with gpt-4.1-mini:\n";
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

// Test Gemini endpoint với model hợp lệ
$geminiData = [
    'prompt' => 'Hello, how are you?',
    'model' => 'gemini-2.5-flash', // Model hợp lệ
    'max_tokens' => 100,
    'temperature' => 0.7
];

echo "2. Testing Gemini endpoint with gemini-2.5-flash:\n";
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

// Test lại với model cũ để xác nhận lỗi đã fix
$oldOpenaiData = [
    'prompt' => 'Hello, how are you?',
    'model' => 'gpt-3.5-turbo', // Model cũ
    'max_tokens' => 100,
    'temperature' => 0.7
];

echo "3. Testing OpenAI endpoint with OLD gpt-3.5-turbo (should work now):\n";
$ch3 = curl_init($baseUrl . '/api/ai/process-text');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_POST, true);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch3, CURLOPT_POSTFIELDS, json_encode($oldOpenaiData));

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);

echo "HTTP Code: $httpCode3\n";
echo "Response: $response3\n";
echo "\n";

echo "========================================\n";
echo "Test completed!\n";
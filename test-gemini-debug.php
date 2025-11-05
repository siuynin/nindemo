<?php

// Test Gemini API với debug
$token = 'P4GyhW9GQg9zGLCzKE9W30of8Dc6OHoPkIPqRJuxafb534df';

// Prompt gốc gây lỗi
$prompt = "tạo prompt video 2 người cãi nhau";

// Test với Gemini endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8001/api/ai/process-text-gemini');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'prompt' => $prompt,
    'model' => 'gemini-2.5-flash',
    'max_tokens' => 1000,
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

echo "=== GEMINI API TEST ===\n";
echo "Prompt: $prompt\n";
echo "HTTP Code: $httpCode\n";
echo "Response: " . $response . "\n\n";

// Kiểm tra log Laravel
echo "=== CHECK LARAVEL LOGS ===\n";
$logFile = 'd:\\AI\\nindemo\\saas-backend\\storage\\logs\\laravel.log';
if (file_exists($logFile)) {
    $logs = file_get_contents($logFile);
    // Lấy 20 dòng log cuối cùng
    $lines = explode("\n", $logs);
    $lastLines = array_slice($lines, -20);
    echo "Last 20 log lines:\n";
    echo implode("\n", $lastLines);
} else {
    echo "Log file not found at: $logFile\n";
}
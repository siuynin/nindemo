<?php

// Test webhook endpoint manually
$webhookUrl = 'http://localhost:8001/api/runninghub/video-webhook';

// Test data - simulate RunningHub webhook payload
$testData = [
    'taskId' => '1979836156785426433', // Use actual task ID from our test
    'code' => 0, // 0 = success
    'msg' => 'success',
    'data' => [
        [
            'fileUrl' => 'https://example.com/test-video.mp4',
            'fileType' => 'mp4'
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: RunningHub-Webhook/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

echo "Testing webhook endpoint...\n";
echo "URL: $webhookUrl\n";
echo "Payload: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n";
echo "========================\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    echo "CURL Error: $error\n";
} else {
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n";
}
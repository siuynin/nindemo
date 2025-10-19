<?php

require_once 'vendor/autoload.php';

/**
 * Test script for Bug Report API endpoints
 */

$baseUrl = 'http://localhost:8001/api';

// Test data
$testData = [
    'title' => 'Test Bug Report',
    'description' => 'This is a test bug report description. The application crashes when clicking the submit button.',
];

// Headers for authenticated requests (you'll need to get a valid token)
$headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    // 'Authorization: Bearer YOUR_TOKEN_HERE' // Uncomment and add real token for authenticated tests
];

function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'response' => $response
    ];
}

echo "=== Bug Report API Test ===\n\n";

// Test 1: Create Bug Report (without authentication - should fail)
echo "1. Testing Create Bug Report (without auth):\n";
$result = makeRequest("$baseUrl/bug-reports", 'POST', $testData, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

// Test 2: Get Bug Reports List (without authentication - should fail)
echo "2. Testing Get Bug Reports List (without auth):\n";
$result = makeRequest("$baseUrl/bug-reports", 'GET', null, [
    'Accept: application/json'
]);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

// Test 3: Admin Statistics (without authentication - should fail)
echo "3. Testing Admin Statistics (without auth):\n";
$result = makeRequest("$baseUrl/admin/bug-reports/statistics", 'GET', null, [
    'Accept: application/json'
]);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

// Test 4: Admin Bug Reports List (without authentication - should fail)
echo "4. Testing Admin Bug Reports List (without auth):\n";
$result = makeRequest("$baseUrl/admin/bug-reports", 'GET', null, [
    'Accept: application/json'
]);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

echo "=== Test Complete ===\n";
echo "Note: All tests should return 401 Unauthorized since no authentication token was provided.\n";
echo "To test with authentication, uncomment the Authorization header and add a valid token.\n";
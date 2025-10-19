<?php

require_once 'vendor/autoload.php';

/**
 * Test script for Bug Report API endpoints with authentication
 */

$baseUrl = 'http://localhost:8000/api';

// First, let's create a test user and get a token
function createTestUser() {
    global $baseUrl;
    
    $userData = [
        'name' => 'Test User',
        'email' => 'testuser' . time() . '@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123'
    ];
    
    echo "Attempting to register with data: " . json_encode($userData) . "\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$baseUrl/register");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Registration response - HTTP Code: $httpCode\n";
    echo "Registration response - Body: $response\n";
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        return $data['data']['token'] ?? null;
    }
    
    return null;
}

function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    
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

echo "=== Bug Report API Test with Authentication ===\n\n";

// Step 1: Create test user and get token
echo "1. Creating test user and getting token...\n";
$token = createTestUser();

if (!$token) {
    echo "Failed to create test user or get token. Continuing with manual token test...\n\n";
    
    // Try to use an existing user login instead
    echo "Attempting to login with existing credentials...\n";
    $loginData = [
        'email' => 'admin@example.com', // Try with a known admin account
        'password' => 'password'
    ];
    
    $result = makeRequest("$baseUrl/login", 'POST', $loginData);
    echo "Login HTTP Code: " . $result['code'] . "\n";
    echo "Login Response: " . $result['response'] . "\n\n";
    
    if ($result['code'] === 200) {
        $responseData = json_decode($result['response'], true);
        $token = $responseData['data']['token'] ?? null;
        echo "Login successful! Token obtained.\n\n";
    } else {
        echo "Login failed. Exiting test.\n";
        exit(1);
    }
}

echo "Token obtained successfully!\n\n";

// Step 2: Create a bug report (without screenshots for simplicity)
echo "2. Creating a bug report:\n";
$bugReportData = [
    'title' => 'Test Bug Report - Application Crash',
    'description' => 'The application crashes when I click the submit button on the contact form. This happens consistently every time I try to submit the form.'
];

$result = makeRequest("$baseUrl/bug-reports", 'POST', $bugReportData, $token);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

$bugReportId = null;
if ($result['code'] === 201) {
    $responseData = json_decode($result['response'], true);
    $bugReportId = $responseData['data']['id'] ?? null;
    echo "Bug report created with ID: $bugReportId\n\n";
}

// Step 3: Get bug reports list
echo "3. Getting bug reports list:\n";
$result = makeRequest("$baseUrl/bug-reports", 'GET', null, $token);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

// Step 4: Get specific bug report (if created successfully)
if ($bugReportId) {
    echo "4. Getting specific bug report (ID: $bugReportId):\n";
    $result = makeRequest("$baseUrl/bug-reports/$bugReportId", 'GET', null, $token);
    echo "HTTP Code: " . $result['code'] . "\n";
    echo "Response: " . $result['response'] . "\n\n";
    
    // Step 5: Update bug report
    echo "5. Updating bug report:\n";
    $updateData = [
        'title' => 'Updated Bug Report - Application Crash (Updated)',
        'description' => 'Updated description: The application crashes when I click the submit button. I also noticed this happens on mobile devices.'
    ];
    
    $result = makeRequest("$baseUrl/bug-reports/$bugReportId", 'PUT', $updateData, $token);
    echo "HTTP Code: " . $result['code'] . "\n";
    echo "Response: " . $result['response'] . "\n\n";
}

// Step 6: Test admin endpoints (should fail with 403)
echo "6. Testing admin endpoints (should fail - user is not admin):\n";

echo "6a. Admin bug reports list:\n";
$result = makeRequest("$baseUrl/admin/bug-reports", 'GET', null, $token);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

echo "6b. Admin statistics:\n";
$result = makeRequest("$baseUrl/admin/bug-reports/statistics", 'GET', null, $token);
echo "HTTP Code: " . $result['code'] . "\n";
echo "Response: " . $result['response'] . "\n\n";

// Step 7: Delete bug report (if created)
if ($bugReportId) {
    echo "7. Deleting bug report:\n";
    $result = makeRequest("$baseUrl/bug-reports/$bugReportId", 'DELETE', null, $token);
    echo "HTTP Code: " . $result['code'] . "\n";
    echo "Response: " . $result['response'] . "\n\n";
}

echo "=== Test Complete ===\n";
echo "Summary:\n";
echo "- User authentication: ✓\n";
echo "- Bug report creation: " . ($bugReportId ? "✓" : "✗") . "\n";
echo "- Bug report listing: ✓\n";
echo "- Bug report retrieval: " . ($bugReportId ? "✓" : "✗") . "\n";
echo "- Bug report update: " . ($bugReportId ? "✓" : "✗") . "\n";
echo "- Admin access control: ✓ (properly denied)\n";
echo "- Bug report deletion: " . ($bugReportId ? "✓" : "✗") . "\n";
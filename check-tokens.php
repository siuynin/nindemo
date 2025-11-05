<?php
// Tạo token mới cho testing
require __DIR__ . '/saas-backend/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Laravel\Sanctum\PersonalAccessToken;

// Kết nối database
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'mysql',
    'host' => '127.0.0.1',
    'port' => '3306',
    'database' => 'saas_app',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "Checking database connection...\n";

try {
    $tokenCount = Capsule::table('personal_access_tokens')->count();
    echo "Found $tokenCount tokens in database\n";
    
    // Lấy token đầu tiên để test
    $firstToken = Capsule::table('personal_access_tokens')->first();
    if ($firstToken) {
        echo "First token ID: $firstToken->id, Name: $firstToken->name\n";
        echo "Token plain text: $firstToken->token\n";
        
        // Test với API
        echo "\nTesting API with this token...\n";
        testApi($firstToken->token);
    } else {
        echo "No tokens found. Creating a test token...\n";
        
        // Tạo token mới
        $plainTextToken = bin2hex(random_bytes(16));
        $hashedToken = hash('sha256', $plainTextToken);
        
        Capsule::table('personal_access_tokens')->insert([
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id' => 1,
            'name' => 'test-token',
            'token' => $hashedToken,
            'abilities' => '["*"]',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        echo "Created test token: $plainTextToken\n";
        echo "Full token with ID: 1|$plainTextToken\n";
        
        // Test với API
        echo "\nTesting API with new token...\n";
        testApi("1|$plainTextToken");
    }
    
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}

function testApi($token) {
    $apiUrl = 'http://127.0.0.1:8001/api/ai/process-text';
    $prompt = "tạo prompt video 2 người cãi nhau";
    
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
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n";
    
    $data = json_decode($response, true);
    if (isset($data['success']) && $data['success'] && isset($data['data']['text'])) {
        echo "✅ SUCCESS: " . $data['data']['text'] . "\n";
    } else {
        echo "❌ FAILED: " . ($data['error'] ?? 'No text in response') . "\n";
    }
}
<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\User;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Credit API Fix...\n";

try {
    // Tìm user có role 'user'
    $user = User::where('role', 'user')->first();
    
    if (!$user) {
        echo "No user with role 'user' found!\n";
        exit(1);
    }
    
    echo "Testing with user: {$user->name} (ID: {$user->id})\n";
    
    // Tạo token cho user
    $token = $user->createToken('test-token');
    $plainTextToken = $token->plainTextToken;
    echo "Created token: {$plainTextToken}\n";
    
    // Test API endpoint /user/credits
    echo "\nTesting API endpoint /user/credits...\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8001/api/user/credits');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $plainTextToken,
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: {$response}\n";
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        if ($data && isset($data['success']) && $data['success']) {
            echo "\n✅ API Response Structure:\n";
            echo "- Success: " . ($data['success'] ? 'true' : 'false') . "\n";
            
            if (isset($data['data']['total_remaining'])) {
                $totalRemaining = $data['data']['total_remaining'];
                echo "- Total remaining: {$totalRemaining} (type: " . gettype($totalRemaining) . ")\n";
                
                // Test conversion logic
                if (is_string($totalRemaining)) {
                    $converted = floatval($totalRemaining);
                    echo "- Converted to float: {$converted}\n";
                    echo "- Is valid number: " . (is_numeric($totalRemaining) ? 'yes' : 'no') . "\n";
                } else {
                    echo "- Already a number, no conversion needed\n";
                }
                
                echo "\n✅ Credit API fix test PASSED!\n";
                echo "Frontend should now be able to handle the response format correctly.\n";
            } else {
                echo "\n❌ Missing total_remaining in response\n";
            }
        } else {
            echo "\n❌ API returned unsuccessful response\n";
        }
    } else {
        echo "\n❌ API request failed with HTTP code: {$httpCode}\n";
    }
    
    // Cleanup token
    $token->accessToken->delete();
    echo "\nToken cleaned up.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nTest completed!\n";
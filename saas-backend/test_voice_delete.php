<?php
/**
 * Test script for voice clone delete functionality
 * This script tests the delete voice clone API endpoint with Minimax integration
 */

require_once __DIR__ . '/vendor/autoload.php';

// Set up Laravel environment
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\VoiceClone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

echo "Testing Voice Clone Delete Functionality\n";
echo "========================================\n\n";

// Get the latest voice clone with a voice_id
$voiceClone = VoiceClone::whereNotNull('voice_id')
    ->where('status', 'completed')
    ->orderBy('id', 'desc')
    ->first();

if (!$voiceClone) {
    echo "No completed voice clone with voice_id found.\n";
    echo "Creating a test voice clone...\n";
    
    // Create a test voice clone
    $voiceClone = VoiceClone::create([
        'user_id' => 1, // Assuming user ID 1 exists
        'voice_name' => 'Test Voice for Delete',
        'voice_id' => '564917', // Use the voice_id from our successful test
        'file_path' => 'test_voice.mp3',
        'preview_text' => 'Test preview text',
        'language_tag' => 'English',
        'gender_tag' => 'male',
        'need_noise_reduction' => false,
        'status' => 'completed',
        'platform' => 'minimax',
        'credit_cost' => 100,
        'cloned_at' => now()
    ]);
    
    echo "Test voice clone created with ID: {$voiceClone->id}\n";
}

echo "Found voice clone:\n";
echo "- ID: {$voiceClone->id}\n";
echo "- Voice Name: {$voiceClone->voice_name}\n";
echo "- Voice ID: {$voiceClone->voice_id}\n";
echo "- Status: {$voiceClone->status}\n\n";

// Test the delete API endpoint
echo "Testing delete API endpoint...\n";

// Get auth token (you may need to adjust this based on your authentication setup)
$authToken = 'your_test_token_here'; // Replace with actual token if needed

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'http://127.0.0.1:8001/api/voice-clones/' . $voiceClone->id,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'DELETE',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $authToken,
        'Accept: application/json',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Response Code: {$httpCode}\n";
echo "Response: {$response}\n\n";

// Parse response
$responseData = json_decode($response, true);
if ($responseData && isset($responseData['success']) && $responseData['success']) {
    echo "✅ Voice clone deleted successfully!\n";
    
    // Verify the voice clone is actually deleted
    $deletedClone = VoiceClone::find($voiceClone->id);
    if (!$deletedClone) {
        echo "✅ Voice clone record removed from database\n";
    } else {
        echo "❌ Voice clone still exists in database\n";
    }
} else {
    echo "❌ Failed to delete voice clone\n";
    if (isset($responseData['message'])) {
        echo "Error: {$responseData['message']}\n";
    }
}

echo "\nTest completed.\n";
<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Generate;
use Illuminate\Support\Facades\Storage;

// Create a test audio file content
$testAudioContent = "This is a test audio file for S3 testing";

// Create a new generate record for user 2
$generate = Generate::create([
    'user_id' => 2,
    'name' => 'Test S3 Audio',
    'content' => 'Test content for S3 audio generation',
    'type' => 'elevenlabs',
    'status' => 'processing',
    'task_id' => 'test_s3_' . time()
]);

echo "Created generate record with ID: {$generate->id}\n";

// Upload test file to S3
$fileName = 'audio/' . $generate->id . '_' . time() . '.mp3';
$s3Path = Storage::disk('s3')->put($fileName, $testAudioContent);

if ($s3Path) {
    // Get the full S3 URL
    $s3Url = Storage::disk('s3')->url($fileName);
    
    // Update the generate record
    $generate->update([
        'status' => 'completed',
        'file_patch' => $s3Url,
        'result_url' => $s3Url,
        'completed_at' => now()
    ]);
    
    echo "File uploaded to S3 successfully!\n";
    echo "S3 URL: {$s3Url}\n";
    echo "Generate ID: {$generate->id}\n";
    echo "You can now test download with: /api/generates/{$generate->id}/download\n";
} else {
    echo "Failed to upload file to S3\n";
    $generate->update([
        'status' => 'failed',
        'error_message' => 'Failed to upload test file to S3'
    ]);
}
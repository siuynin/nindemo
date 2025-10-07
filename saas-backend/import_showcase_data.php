<?php

require_once 'vendor/autoload.php';

// Load Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Generate;
use App\Services\ImageStorageService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

echo "=== Showcase Data Import Script ===\n";

// Initialize services
$imageStorageService = new ImageStorageService();

// Check S3 configuration
echo "Checking S3 configuration...\n";
if (!$imageStorageService->isS3Configured()) {
    echo "WARNING: S3 is not configured. Images will not be uploaded to S3.\n";
    $s3Status = $imageStorageService->getS3Status();
    print_r($s3Status);
    
    // Ask user if they want to continue without S3
    echo "\nDo you want to continue without S3 upload? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    fclose($handle);
    
    if (trim(strtolower($line)) !== 'y') {
        echo "Import cancelled.\n";
        exit(1);
    }
} else {
    echo "S3 is configured and ready.\n";
}

// Read JSON data
$jsonFile = __DIR__ . '/showcase_parsed.json';
if (!file_exists($jsonFile)) {
    die("Error: showcase_parsed.json file not found!\n");
}

echo "Reading JSON data from: $jsonFile\n";
$jsonData = file_get_contents($jsonFile);
$data = json_decode($jsonData, true);

if (!$data) {
    die("Error: Failed to parse JSON data!\n");
}

echo "Found " . count($data) . " records to import.\n";

// Ask for batch size
echo "Enter batch size (default 10, max 50): ";
$handle = fopen("php://stdin", "r");
$batchSizeInput = trim(fgets($handle));
fclose($handle);

$batchSize = !empty($batchSizeInput) && is_numeric($batchSizeInput) ? 
    min(max(1, intval($batchSizeInput)), 50) : 10;

echo "Using batch size: $batchSize\n";

// Start transaction
DB::beginTransaction();

try {
    $imported = 0;
    $errors = 0;
    $skipped = 0;
    
    foreach ($data as $index => $item) {
        echo "\nProcessing record " . ($index + 1) . "/" . count($data) . "...\n";
        
        try {
            // Check if record already exists (avoid duplicates)
            $existingRecord = Generate::where('name', $item['name'])
                ->where('user_id', $item['user_id'] ?? 2)
                ->first();
                
            if ($existingRecord) {
                echo "  ⚠ Record already exists, skipping...\n";
                $skipped++;
                continue;
            }
            
            // Prepare result_url with S3 upload
            $resultUrls = [];
            
            if (isset($item['result_url']) && is_array($item['result_url'])) {
                foreach ($item['result_url'] as $urlData) {
                    if (isset($urlData['url'])) {
                        $originalUrl = $urlData['url'];
                        $finalUrl = $originalUrl;
                        
                        // Try to upload to S3 if configured
                        if ($imageStorageService->isS3Configured()) {
                            try {
                                echo "  Uploading image to S3: " . basename($originalUrl) . "\n";
                                $s3Url = $imageStorageService->uploadImageFromUrl($originalUrl, 'showcase-images');
                                $finalUrl = $s3Url;
                                echo "  ✓ Uploaded to S3: " . basename($s3Url) . "\n";
                            } catch (Exception $s3Error) {
                                echo "  ✗ S3 upload failed: " . $s3Error->getMessage() . "\n";
                                echo "  Using original URL as fallback\n";
                            }
                        }
                        
                        $resultUrls[] = [
                            'seed' => $urlData['seed'] ?? null,
                            'url' => $finalUrl
                        ];
                    }
                }
            }
            
            // Prepare content data
            $contentData = [
                'prompt' => $item['content']['prompt'] ?? $item['name'],
                'model' => $item['content']['model'] ?? 'runware:97@2'
            ];
            
            // Prepare name with length limit (trim if too long)
            $name = $item['name'] ?? 'Imported from showcase';
            if (strlen($name) > 255) {
                $name = substr($name, 0, 252) . '...';
                echo "  ⚠ Name trimmed to 255 characters\n";
            }
            
            // Create Generate record
            $generate = Generate::create([
                'user_id' => $item['user_id'] ?? 2,
                'name' => $name,
                'content' => json_encode($contentData),
                'type' => $item['type'] ?? 'image',
                'status' => $item['status'] ?? 'completed',
                'share' => $item['share'] ?? 'public',
                'result_url' => json_encode($resultUrls),
                'completed_at' => now(),
                'credit_cost' => 1.00 // Default credit cost
            ]);
            
            echo "  ✓ Created Generate record ID: " . $generate->id . "\n";
            $imported++;
            
            // Commit in batches to avoid memory issues
            if ($imported % $batchSize === 0) {
                DB::commit();
                DB::beginTransaction();
                echo "  📦 Batch committed ($imported records so far)\n";
            }
            
        } catch (Exception $e) {
            echo "  ✗ Error processing record: " . $e->getMessage() . "\n";
            $errors++;
            
            // Continue with next record instead of stopping
            continue;
        }
        
        // Add small delay to avoid overwhelming the system
        usleep(200000); // 0.2 second delay
    }
    
    // Commit final transaction
    DB::commit();
    
    echo "\n=== Import Summary ===\n";
    echo "Total records processed: " . count($data) . "\n";
    echo "Successfully imported: $imported\n";
    echo "Skipped (duplicates): $skipped\n";
    echo "Errors: $errors\n";
    echo "Import completed successfully!\n";
    
} catch (Exception $e) {
    // Rollback transaction on error
    DB::rollback();
    echo "\n✗ Import failed: " . $e->getMessage() . "\n";
    echo "Transaction rolled back.\n";
    exit(1);
}
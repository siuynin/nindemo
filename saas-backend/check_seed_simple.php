<?php
require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Generate;

echo "=== Kiểm tra seed trong result_url ===\n\n";

try {
    // Lấy 3 bản ghi image gần nhất có result_url
    $generates = Generate::where('type', 'image')
        ->whereNotNull('result_url')
        ->orderBy('created_at', 'desc')
        ->limit(3)
        ->get(['id', 'type', 'result_url', 'created_at']);
    
    echo "Tìm thấy " . $generates->count() . " bản ghi image có result_url:\n\n";
    
    foreach ($generates as $generate) {
        echo "ID: " . $generate->id . "\n";
        echo "Type: " . $generate->type . "\n";
        echo "Created: " . $generate->created_at . "\n";
        echo "Result URL (first 200 chars): " . substr($generate->result_url, 0, 200) . "...\n";
        
        // Parse JSON
        $resultData = json_decode($generate->result_url, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "JSON Parse: SUCCESS\n";
            
            if (is_array($resultData)) {
                echo "Format: Array with " . count($resultData) . " items\n";
                
                // Kiểm tra item đầu tiên
                if (isset($resultData[0])) {
                    $firstItem = $resultData[0];
                    if (isset($firstItem['seed'])) {
                        echo "First Seed: " . $firstItem['seed'] . "\n";
                    } else {
                        echo "First Seed: NOT FOUND\n";
                    }
                    
                    if (isset($firstItem['url'])) {
                        echo "First URL: " . substr($firstItem['url'], 0, 60) . "...\n";
                    } else {
                        echo "First URL: NOT FOUND\n";
                    }
                }
            } else {
                echo "Format: Not an array\n";
                if (isset($resultData['seed'])) {
                    echo "Seed: " . $resultData['seed'] . "\n";
                }
                if (isset($resultData['url'])) {
                    echo "URL: " . substr($resultData['url'], 0, 60) . "...\n";
                }
            }
        } else {
            echo "JSON Parse: FAILED - " . json_last_error_msg() . "\n";
        }
        
        echo "----------------------------------------\n\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
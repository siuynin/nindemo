<?php

require_once __DIR__ . '/vendor/autoload.php';

echo "Starting import with correct database structure...\n";

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Check if filename is provided as argument
if ($argc < 2) {
    echo "Usage: php import_with_correct_structure.php <json_filename>\n";
    exit(1);
}

$filename = $argv[1];
$filepath = __DIR__ . '/exports/' . $filename;

echo "Looking for file: {$filepath}\n";

if (!file_exists($filepath)) {
    echo "Error: File not found: {$filepath}\n";
    exit(1);
}

try {
    echo "Reading JSON file: {$filename}\n";
    $jsonData = file_get_contents($filepath);
    $data = json_decode($jsonData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON format: ' . json_last_error_msg());
    }
    
    echo "\n=== IMPORT WITH CORRECT STRUCTURE ===\n";
    
    // Import PricingPlan data
    if (isset($data['pricing_plans'])) {
        echo "Importing PricingPlan data...\n";
        $imported = 0;
        $skipped = 0;
        
        // Don't truncate - we want to preserve existing data and update
        // DB::table('pricing_plans')->truncate();
        
        foreach ($data['pricing_plans'] as $item) {
            try {
                echo "Processing PricingPlan ID {$item['id']}: {$item['name']}\n";
                
                // Prepare data according to ACTUAL database structure
                $planData = [
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'billing_cycle' => $item['billing_cycle'],
                    'credits_included' => (int) ($item['credits_included'] ?? ($item['credits'] ?? 0)),
                    // features is BOOLEAN in database, not JSON - convert to boolean
                    'features' => !empty($item['features']) && is_array($item['features']) && count($item['features']) > 0,
                    'max_voice_clone' => isset($item['max_voice_clone']) ? (int) $item['max_voice_clone'] : 0,
                    'is_premium' => isset($item['is_premium']) ? (bool) $item['is_premium'] : false,
                    'is_active' => isset($item['is_active']) ? (bool) $item['is_active'] : true,
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : 0,
                    'status' => $item['status'] ?? 'active',
                    'is_popular' => isset($item['is_popular']) ? (bool) $item['is_popular'] : false,
                    'created_at' => $item['created_at'],
                    'updated_at' => $item['updated_at'],
                ];
                
                // Use updateOrInsert to handle both insert and update
                DB::table('pricing_plans')->updateOrInsert(
                    ['id' => $item['id']],
                    $planData
                );
                
                echo "  - Successfully imported PricingPlan ID {$item['id']}\n";
                $imported++;
                
            } catch (\Exception $e) {
                echo "  - Error with PricingPlan ID {$item['id']}: " . $e->getMessage() . "\n";
                $skipped++;
            }
        }
        echo "\n- PricingPlan: {$imported} imported, {$skipped} skipped\n";
    } else {
        echo "No pricing_plans data found in this file.\n";
    }
    
    echo "\n=== IMPORT COMPLETED ===\n";
    echo "Pricing plans imported from: {$filename}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
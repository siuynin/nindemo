<?php

require_once __DIR__ . '/vendor/autoload.php';

echo "Starting simple import process...\n";

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Check if filename is provided as argument
if ($argc < 2) {
    echo "Usage: php simple_import.php <json_filename>\n";
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
    
    echo "\n=== SIMPLE IMPORT PRICING PLANS ===\n";
    
    // Import PricingPlan data
    if (isset($data['pricing_plans'])) {
        echo "Importing PricingPlan data...\n";
        $imported = 0;
        $skipped = 0;
        
        // Clear existing data first
        DB::table('pricing_plans')->truncate();
        echo "Cleared existing pricing_plans data.\n";
        
        foreach ($data['pricing_plans'] as $item) {
            try {
                echo "Processing PricingPlan ID {$item['id']}: {$item['name']}\n";
                
                // Prepare data for direct DB insert
                $planData = [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'billing_cycle' => $item['billing_cycle'],
                    'credits_included' => (int) ($item['credits_included'] ?? ($item['credits'] ?? 0)),
                    'features' => isset($item['features']) ? json_encode($item['features']) : '[]',
                    'max_voice_clone' => isset($item['max_voice_clone']) ? (int) $item['max_voice_clone'] : 0,
                    'is_premium' => isset($item['is_premium']) ? (bool) $item['is_premium'] : false,
                    'is_active' => isset($item['is_active']) ? (bool) $item['is_active'] : true,
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : 0,
                    'status' => $item['status'] ?? 'active',
                    'is_popular' => isset($item['is_popular']) ? (bool) $item['is_popular'] : false,
                    'created_at' => $item['created_at'],
                    'updated_at' => $item['updated_at'],
                ];
                
                // Direct DB insert
                DB::table('pricing_plans')->insert($planData);
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
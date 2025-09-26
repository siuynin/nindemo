<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PricingPlan;

// Check if filename is provided as argument
if ($argc < 2) {
    echo "Usage: php import_pricing_plans_only.php <json_filename>\n";
    echo "Example: php import_pricing_plans_only.php models_export_2025-09-23_08-14-14.json\n";
    exit(1);
}

$filename = $argv[1];
$filepath = __DIR__ . '/exports/' . $filename;

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
    
    echo "\n=== IMPORTING PRICING PLANS ONLY ===\n";
    
    // Import PricingPlan data with proper data type handling
    if (isset($data['pricing_plans'])) {
        echo "Importing PricingPlan data...\n";
        $imported = 0;
        $skipped = 0;
        
        foreach ($data['pricing_plans'] as $item) {
            try {
                // Prepare data with correct types
                $planData = [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'billing_cycle' => $item['billing_cycle'],
                    'features' => is_array($item['features']) ? json_encode($item['features']) : $item['features'],
                    'max_voice_clone' => (int) $item['max_voice_clone'],
                    'is_premium' => (bool) $item['is_premium'],
                    'is_active' => (bool) $item['is_active'],
                    'sort_order' => (int) ($item['sort_order'] ?? 0),
                    'credits' => (int) $item['credits'],
                    'status' => $item['status'],
                    'is_popular' => (bool) $item['is_popular'],
                    'created_at' => $item['created_at'],
                    'updated_at' => $item['updated_at'],
                ];
                
                // Force update or create
                $existing = PricingPlan::find($item['id']);
                if ($existing) {
                    $existing->update($planData);
                    echo "  - Updated PricingPlan ID {$item['id']}: {$item['name']}\n";
                } else {
                    PricingPlan::create($planData);
                    echo "  - Created PricingPlan ID {$item['id']}: {$item['name']}\n";
                }
                $imported++;
                
            } catch (\Exception $e) {
                echo "  - Error with PricingPlan ID {$item['id']}: " . $e->getMessage() . "\n";
                $skipped++;
            }
        }
        echo "- PricingPlan: {$imported} imported, {$skipped} skipped\n";
    } else {
        echo "No pricing_plans data found in the JSON file.\n";
    }
    
    echo "\n=== IMPORT COMPLETED ===\n";
    echo "Pricing plans imported from: {$filename}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
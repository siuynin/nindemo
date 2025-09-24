<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AIModel;
use App\Models\Bill;
use App\Models\File;
use App\Models\Generate;
use App\Models\OpenAI;
use App\Models\PayPalTransaction;
use App\Models\PricingPlan;
use App\Models\User;
use App\Models\UserCredit;
use App\Models\Voice;
use Illuminate\Support\Facades\DB;

// Check if filename is provided as argument
if ($argc < 2) {
    echo "Usage: php import_models_data_safe.php <json_filename>\n";
    echo "Example: php import_models_data_safe.php models_export_2025-09-23_08-14-14.json\n";
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
    
    echo "\n=== STARTING SAFE IMPORT ===\n";
    
    // Import AIModel data with force overwrite
    if (isset($data['ai_models'])) {
        echo "Importing AIModel data (force overwrite)...\n";
        $imported = 0;
        $skipped = 0;
        
        foreach ($data['ai_models'] as $item) {
            try {
                // First try to find by ID
                $existing = AIModel::find($item['id']);
                
                if ($existing) {
                    // Force update existing record by ID
                    $existing->update([
                        'name' => $item['name'],
                        'slug' => $item['slug'],
                        'platform' => $item['platform'],
                        'thumbnail' => $item['thumbnail'],
                        'type' => $item['type'],
                        'credit_price' => $item['credit_price'],
                        'short_description' => $item['short_description'],
                    ]);
                    echo "  - Force updated AIModel ID {$item['id']}: {$item['name']}\n";
                    $imported++;
                } else {
                    // Check if slug exists with different ID
                    $existingBySlug = AIModel::where('slug', $item['slug'])->first();
                    if ($existingBySlug) {
                        // Update the existing record with new data
                        $existingBySlug->update($item);
                        echo "  - Force updated AIModel by slug: {$item['name']} (slug: {$item['slug']})\n";
                        $imported++;
                    } else {
                        // Create new record
                        AIModel::create($item);
                        echo "  - Created AIModel: {$item['name']} (slug: {$item['slug']})\n";
                        $imported++;
                    }
                }
            } catch (\Exception $e) {
                echo "  - Error with AIModel ID {$item['id']}: " . $e->getMessage() . "\n";
                $skipped++;
            }
        }
        echo "- AIModel: {$imported} imported, {$skipped} skipped\n";
    }
    
    // Import other models with similar safe handling
    $models = [
        'bills' => [Bill::class, 'Bill'],
        'files' => [File::class, 'File'],
        'generates' => [Generate::class, 'Generate'],
        'openai' => [OpenAI::class, 'OpenAI'],
        'paypal_transactions' => [PayPalTransaction::class, 'PayPalTransaction'],
        'pricing_plans' => [PricingPlan::class, 'PricingPlan', true], // Force overwrite
        'user_credits' => [UserCredit::class, 'UserCredit'],
        'voices' => [Voice::class, 'Voice'],
    ];
    
    foreach ($models as $key => $modelInfo) {
        $modelClass = $modelInfo[0];
        $modelName = $modelInfo[1];
        $forceOverwrite = isset($modelInfo[2]) ? $modelInfo[2] : false;
        
        if (isset($data[$key])) {
            echo "Importing {$modelName} data" . ($forceOverwrite ? " (force overwrite)" : "") . "...\n";
            $imported = 0;
            $skipped = 0;
            
            foreach ($data[$key] as $item) {
                try {
                    if ($forceOverwrite) {
                        // Force overwrite: find existing record and update, or create new
                        $existing = $modelClass::find($item['id']);
                        if ($existing) {
                            $existing->update($item);
                            echo "  - Force updated {$modelName} ID {$item['id']}\n";
                        } else {
                            $modelClass::create($item);
                            echo "  - Created {$modelName} ID {$item['id']}\n";
                        }
                        $imported++;
                    } else {
                        // Normal updateOrCreate
                        $modelClass::updateOrCreate(['id' => $item['id']], $item);
                        $imported++;
                    }
                } catch (\Exception $e) {
                    echo "  - " . ($forceOverwrite ? "Error" : "Skipped") . " {$modelName} ID {$item['id']}: " . $e->getMessage() . "\n";
                    $skipped++;
                }
            }
            echo "- {$modelName}: {$imported} imported, {$skipped} skipped\n";
        }
    }
    
    // Import User data with special handling
    if (isset($data['users'])) {
        echo "Importing User data...\n";
        $imported = 0;
        $skipped = 0;
        
        foreach ($data['users'] as $item) {
            try {
                // Check if user exists
                $existingUser = User::find($item['id']);
                if ($existingUser) {
                    // Update without changing password
                    $updateData = $item;
                    unset($updateData['password']); // Don't update password
                    $existingUser->update($updateData);
                    $imported++;
                } else {
                    // For new users, we need a password
                    if (!isset($item['password'])) {
                        $item['password'] = bcrypt('defaultpassword123'); // Set default password
                    }
                    User::create($item);
                    $imported++;
                }
            } catch (\Exception $e) {
                echo "  - Skipped User ID {$item['id']}: " . $e->getMessage() . "\n";
                $skipped++;
            }
        }
        echo "- User: {$imported} imported, {$skipped} skipped\n";
    }
    
    echo "\n=== SAFE IMPORT COMPLETED ===\n";
    echo "Data has been imported from: {$filename}\n";
    echo "Note: Some records may have been skipped due to constraints or errors.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
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
    echo "Usage: php import_models_data.php <json_filename>\n";
    echo "Example: php import_models_data.php models_export_2025-09-23_08-14-14.json\n";
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
    
    // Start transaction
    DB::beginTransaction();
    
    echo "\n=== STARTING IMPORT ===\n";
    
    // Import AIModel data
    if (isset($data['ai_models'])) {
        echo "Importing AIModel data...\n";
        foreach ($data['ai_models'] as $item) {
            try {
                AIModel::updateOrCreate(['id' => $item['id']], $item);
            } catch (\Exception $e) {
                // If duplicate slug, try to update by slug instead
                if (strpos($e->getMessage(), 'duplicate key value violates unique constraint') !== false) {
                    echo "  - Duplicate constraint for ID {$item['id']}, trying alternative approach...\n";
                    $existing = AIModel::where('slug', $item['slug'])->first();
                    if ($existing) {
                        $existing->update($item);
                    } else {
                        // If no existing record with that slug, create new one
                        AIModel::create($item);
                    }
                } else {
                    throw $e;
                }
            }
        }
        echo "- Imported " . count($data['ai_models']) . " AIModel records\n";
    }
    
    // Import Bill data
    if (isset($data['bills'])) {
        echo "Importing Bill data...\n";
        foreach ($data['bills'] as $item) {
            Bill::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['bills']) . " Bill records\n";
    }
    
    // Import File data
    if (isset($data['files'])) {
        echo "Importing File data...\n";
        foreach ($data['files'] as $item) {
            File::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['files']) . " File records\n";
    }
    
    // Import Generate data
    if (isset($data['generates'])) {
        echo "Importing Generate data...\n";
        foreach ($data['generates'] as $item) {
            Generate::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['generates']) . " Generate records\n";
    }
    
    // Import OpenAI data
    if (isset($data['openai'])) {
        echo "Importing OpenAI data...\n";
        foreach ($data['openai'] as $item) {
            OpenAI::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['openai']) . " OpenAI records\n";
    }
    
    // Import PayPalTransaction data
    if (isset($data['paypal_transactions'])) {
        echo "Importing PayPalTransaction data...\n";
        foreach ($data['paypal_transactions'] as $item) {
            PayPalTransaction::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['paypal_transactions']) . " PayPalTransaction records\n";
    }
    
    // Import PricingPlan data
    if (isset($data['pricing_plans'])) {
        echo "Importing PricingPlan data...\n";
        foreach ($data['pricing_plans'] as $item) {
            PricingPlan::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['pricing_plans']) . " PricingPlan records\n";
    }
    
    // Import User data (be careful with passwords)
    if (isset($data['users'])) {
        echo "Importing User data...\n";
        foreach ($data['users'] as $item) {
            // Skip password update if not provided
            $existingUser = User::find($item['id']);
            if ($existingUser && !isset($item['password'])) {
                $item['password'] = $existingUser->password;
            }
            User::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['users']) . " User records\n";
    }
    
    // Import UserCredit data
    if (isset($data['user_credits'])) {
        echo "Importing UserCredit data...\n";
        foreach ($data['user_credits'] as $item) {
            UserCredit::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['user_credits']) . " UserCredit records\n";
    }
    
    // Import Voice data
    if (isset($data['voices'])) {
        echo "Importing Voice data...\n";
        foreach ($data['voices'] as $item) {
            Voice::updateOrCreate(['id' => $item['id']], $item);
        }
        echo "- Imported " . count($data['voices']) . " Voice records\n";
    }
    
    // Commit transaction
    DB::commit();
    
    echo "\n=== IMPORT COMPLETED SUCCESSFULLY ===\n";
    echo "All data has been imported from: {$filename}\n";
    
} catch (Exception $e) {
    // Rollback transaction on error
    DB::rollback();
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    echo "\nImport failed. All changes have been rolled back.\n";
}
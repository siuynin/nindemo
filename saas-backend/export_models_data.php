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

try {
    $exportData = [];
    
    // Export AIModel data
    echo "Exporting AIModel data...\n";
    $exportData['ai_models'] = AIModel::all()->toArray();
    
    // Export Bill data
    echo "Exporting Bill data...\n";
    $exportData['bills'] = Bill::all()->toArray();
    
    // Export File data
    echo "Exporting File data...\n";
    $exportData['files'] = File::all()->toArray();
    
    // Export Generate data
    echo "Exporting Generate data...\n";
    $exportData['generates'] = Generate::all()->toArray();
    
    // Export OpenAI data
    echo "Exporting OpenAI data...\n";
    $exportData['openai'] = OpenAI::all()->toArray();
    
    // Export PayPalTransaction data
    echo "Exporting PayPalTransaction data...\n";
    $exportData['paypal_transactions'] = PayPalTransaction::all()->toArray();
    
    // Export PricingPlan data
    echo "Exporting PricingPlan data...\n";
    $exportData['pricing_plans'] = PricingPlan::all()->toArray();
    
    // Export User data (excluding sensitive fields)
    echo "Exporting User data...\n";
    $users = User::all()->map(function ($user) {
        $userData = $user->toArray();
        // Remove sensitive fields
        unset($userData['password']);
        unset($userData['remember_token']);
        return $userData;
    });
    $exportData['users'] = $users->toArray();
    
    // Export UserCredit data
    echo "Exporting UserCredit data...\n";
    $exportData['user_credits'] = UserCredit::all()->toArray();
    
    // Export Voice data
    echo "Exporting Voice data...\n";
    $exportData['voices'] = Voice::all()->toArray();
    
    // Create export directory if it doesn't exist
    $exportDir = __DIR__ . '/exports';
    if (!is_dir($exportDir)) {
        mkdir($exportDir, 0755, true);
    }
    
    // Generate filename with timestamp
    $filename = 'models_export_' . date('Y-m-d_H-i-s') . '.json';
    $filepath = $exportDir . '/' . $filename;
    
    // Save to JSON file
    $jsonData = json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents($filepath, $jsonData);
    
    echo "\n=== EXPORT COMPLETED ===\n";
    echo "File saved: {$filepath}\n";
    echo "Total records exported:\n";
    
    foreach ($exportData as $model => $data) {
        echo "- {$model}: " . count($data) . " records\n";
    }
    
    echo "\nFile size: " . number_format(filesize($filepath) / 1024, 2) . " KB\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
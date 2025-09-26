<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== PRICING PLANS TABLE STRUCTURE ===\n";

$columns = DB::select("
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'pricing_plans' 
    ORDER BY ordinal_position
");

foreach ($columns as $column) {
    echo sprintf(
        "%-20s %-15s %-10s %s\n",
        $column->column_name,
        $column->data_type,
        $column->is_nullable,
        $column->column_default ?? 'NULL'
    );
}

echo "\n=== SAMPLE DATA FROM JSON FILES ===\n";

// Check the structure of pricing plans in the JSON files
$files = [
    'models_export_2025-09-24_06-39-18.json',
    'models_export_2025-09-23_08-14-14.json'
];

foreach ($files as $file) {
    $filepath = __DIR__ . '/exports/' . $file;
    if (file_exists($filepath)) {
        echo "\n--- $file ---\n";
        $jsonData = file_get_contents($filepath);
        $data = json_decode($jsonData, true);
        
        if (isset($data['pricing_plans']) && !empty($data['pricing_plans'])) {
            $firstPlan = $data['pricing_plans'][0];
            echo "First plan structure:\n";
            foreach ($firstPlan as $key => $value) {
                echo sprintf("  %-20s: %s (%s)\n", $key, 
                    is_array($value) ? json_encode($value) : (is_null($value) ? 'NULL' : $value),
                    gettype($value)
                );
            }
        } else {
            echo "No pricing plans found in this file.\n";
        }
    }
}
<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== EXPORT SQLITE DATA ===" . PHP_EOL . PHP_EOL;

// Danh sách các bảng cần export (theo thứ tự để tránh foreign key issues)
$tables = [
    'pricing_plans',
    'users', 
    'user_credits',
    'bills',
    'sepay',
    'pay_pal_transactions',
    'models',
    'voices',
    'generates',
    'files',
    'personal_access_tokens'
];

$exportData = [];

foreach ($tables as $table) {
    try {
        echo "📊 Exporting table: {$table}..." . PHP_EOL;
        
        // Kiểm tra bảng có tồn tại không
        $exists = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [$table]);
        
        if (empty($exists)) {
            echo "⚠️  Table {$table} does not exist, skipping..." . PHP_EOL;
            continue;
        }
        
        // Lấy dữ liệu
        $data = DB::table($table)->get()->toArray();
        $count = count($data);
        
        if ($count > 0) {
            $exportData[$table] = $data;
            echo "✅ Exported {$count} records from {$table}" . PHP_EOL;
        } else {
            echo "ℹ️  Table {$table} is empty" . PHP_EOL;
        }
        
    } catch (\Exception $e) {
        echo "❌ Error exporting {$table}: " . $e->getMessage() . PHP_EOL;
    }
}

// Lưu dữ liệu vào file JSON
$exportFile = 'sqlite_data_export.json';
file_put_contents($exportFile, json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo PHP_EOL . "💾 Data exported to: {$exportFile}" . PHP_EOL;

// Thống kê
echo PHP_EOL . "📈 EXPORT SUMMARY:" . PHP_EOL;
$totalRecords = 0;
foreach ($exportData as $table => $data) {
    $count = count($data);
    $totalRecords += $count;
    echo "  - {$table}: {$count} records" . PHP_EOL;
}
echo "  - TOTAL: {$totalRecords} records" . PHP_EOL;

echo PHP_EOL . "=== EXPORT COMPLETED ===" . PHP_EOL;
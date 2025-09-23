<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FIX BILLS SEQUENCE ===" . PHP_EOL . PHP_EOL;

try {
    // Kiểm tra max ID hiện tại
    $maxId = App\Models\Bill::max('id') ?? 0;
    echo "📊 Current max ID in bills table: {$maxId}" . PHP_EOL;
    
    // Kiểm tra sequence hiện tại
    $currentSeq = DB::select('SELECT currval(\'bills_id_seq\')')[0]->currval ?? 0;
    echo "🔢 Current sequence value: {$currentSeq}" . PHP_EOL;
    
    if ($maxId > $currentSeq) {
        echo "⚠️  Sequence is behind max ID. Fixing..." . PHP_EOL;
        
        // Sửa sequence
        DB::select('SELECT setval(\'bills_id_seq\', ?)', [$maxId]);
        
        $newSeq = DB::select('SELECT currval(\'bills_id_seq\')')[0]->currval;
        echo "✅ Fixed! New sequence value: {$newSeq}" . PHP_EOL;
    } else {
        echo "✅ Sequence is already correct!" . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}

echo PHP_EOL . "=== DONE ===" . PHP_EOL;
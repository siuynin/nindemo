<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Models\Voice;

// Bootstrap Laravel
$app = Application::configure(basePath: __DIR__)
    ->withRouting(
        web: __DIR__.'/routes/web.php',
        api: __DIR__.'/routes/api.php',
        commands: __DIR__.'/routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// File path
$filePath = __DIR__ . '/exports/models_export_2025-09-24_06-39-18.json';

if (!file_exists($filePath)) {
    echo "File không tồn tại: $filePath\n";
    exit(1);
}

echo "Đang đọc file: $filePath\n";

$jsonContent = file_get_contents($filePath);
$data = json_decode($jsonContent, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "Lỗi khi đọc JSON: " . json_last_error_msg() . "\n";
    exit(1);
}

if (!isset($data['voices']) || !is_array($data['voices'])) {
    echo "Không tìm thấy dữ liệu voices trong file\n";
    exit(1);
}

$voices = $data['voices'];
$totalVoices = count($voices);

echo "Tìm thấy $totalVoices bản ghi voices\n";
echo "Bắt đầu nhập dữ liệu...\n\n";

$imported = 0;
$updated = 0;
$errors = 0;

foreach ($voices as $voiceData) {
    try {
        // Chuẩn bị dữ liệu
        $voiceAttributes = [
            'voice_id' => $voiceData['voice_id'],
        ];
        
        $voiceValues = [
            'user_id' => $voiceData['user_id'],
            'name' => $voiceData['name'],
            'voice_id' => $voiceData['voice_id'],
            'language' => $voiceData['language'],
            'category' => $voiceData['category'],
            'preview_url' => $voiceData['preview_url'] ?? null,
            'fine_data' => isset($voiceData['fine_data']) ? json_encode($voiceData['fine_data']) : null,
            'gender' => $voiceData['gender'] ?? null,
            'age' => $voiceData['age'] ?? null,
            'description' => $voiceData['description'] ?? null,
            'platforms' => $voiceData['platforms'] ?? null,
            'status' => $voiceData['status'] ?? true,
            'processed_languages' => isset($voiceData['processed_languages']) ? json_encode($voiceData['processed_languages']) : null,
            'processed_gender' => $voiceData['processed_gender'] ?? null,
            'processed_age' => $voiceData['processed_age'] ?? null,
            'created_at' => $voiceData['created_at'] ?? now(),
            'updated_at' => $voiceData['updated_at'] ?? now(),
        ];

        // Sử dụng updateOrCreate để tránh trùng lặp
        $voice = Voice::updateOrCreate($voiceAttributes, $voiceValues);
        
        if ($voice->wasRecentlyCreated) {
            $imported++;
            echo "✓ Đã tạo mới: {$voiceData['name']} (ID: {$voiceData['id']}, Voice ID: {$voiceData['voice_id']})\n";
        } else {
            $updated++;
            echo "↻ Đã cập nhật: {$voiceData['name']} (ID: {$voiceData['id']}, Voice ID: {$voiceData['voice_id']})\n";
        }
        
    } catch (Exception $e) {
        $errors++;
        echo "✗ Lỗi khi nhập {$voiceData['name']} (ID: {$voiceData['id']}): " . $e->getMessage() . "\n";
    }
}

echo "\n=== KẾT QUẢ NHẬP DỮ LIỆU ===\n";
echo "Tổng số bản ghi: $totalVoices\n";
echo "Đã tạo mới: $imported\n";
echo "Đã cập nhật: $updated\n";
echo "Lỗi: $errors\n";

// Kiểm tra tổng số voices trong database
$totalInDb = Voice::count();
echo "Tổng số voices trong database: $totalInDb\n";

echo "\nHoàn thành!\n";
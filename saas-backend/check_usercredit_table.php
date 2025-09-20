<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== KIỂM TRA BẢNG USER_CREDITS ===" . PHP_EOL . PHP_EOL;

// Kiểm tra bảng có tồn tại không
if (Schema::hasTable('user_credits')) {
    echo "✅ Bảng 'user_credits' tồn tại" . PHP_EOL . PHP_EOL;
    
    // Lấy cấu trúc bảng
    echo "📋 CẤU TRÚC BẢNG:" . PHP_EOL;
    $columns = Schema::getColumnListing('user_credits');
    foreach ($columns as $column) {
        echo "  - " . $column . PHP_EOL;
    }
    echo PHP_EOL;
    
    // Đếm tổng số bản ghi
    $totalRecords = App\Models\UserCredit::count();
    echo "📊 TỔNG SỐ BẢN GHI: " . $totalRecords . PHP_EOL . PHP_EOL;
    
    if ($totalRecords > 0) {
        echo "📄 DỮ LIỆU MẪU (5 bản ghi đầu):" . PHP_EOL;
        $credits = App\Models\UserCredit::take(5)->get();
        foreach ($credits as $credit) {
            echo "  ID: {$credit->id} | User: {$credit->user_id} | Plan: {$credit->pricing_plan_id} | Total: {$credit->total_credits} | Remaining: {$credit->remaining_credits} | Expires: {$credit->expires_at}" . PHP_EOL;
        }
        echo PHP_EOL;
        
        // Thống kê theo user
        echo "📈 THỐNG KÊ THEO USER:" . PHP_EOL;
        $userStats = DB::table('user_credits')
            ->select('user_id', DB::raw('COUNT(*) as total_records'), DB::raw('SUM(remaining_credits) as total_remaining'))
            ->groupBy('user_id')
            ->get();
        
        foreach ($userStats as $stat) {
            echo "  User ID {$stat->user_id}: {$stat->total_records} records, {$stat->total_remaining} remaining credits" . PHP_EOL;
        }
    } else {
        echo "⚠️  Bảng trống - không có dữ liệu" . PHP_EOL;
    }
    
} else {
    echo "❌ Bảng 'user_credits' KHÔNG tồn tại!" . PHP_EOL;
    
    // Kiểm tra các bảng có liên quan
    echo PHP_EOL . "🔍 Kiểm tra các bảng liên quan:" . PHP_EOL;
    $relatedTables = ['users', 'pricing_plans', 'bills'];
    foreach ($relatedTables as $table) {
        if (Schema::hasTable($table)) {
            echo "  ✅ Bảng '{$table}' tồn tại" . PHP_EOL;
        } else {
            echo "  ❌ Bảng '{$table}' không tồn tại" . PHP_EOL;
        }
    }
}

echo PHP_EOL . "=== KẾT THÚC KIỂM TRA ===" . PHP_EOL;
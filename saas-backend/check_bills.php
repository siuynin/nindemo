<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== KIỂM TRA BẢNG BILLS ===" . PHP_EOL . PHP_EOL;

$totalBills = App\Models\Bill::count();
$paidBills = App\Models\Bill::where('status', 'paid')->count();
$pendingBills = App\Models\Bill::where('status', 'pending')->count();

echo "📊 THỐNG KÊ BILLS:" . PHP_EOL;
echo "  - Tổng số bills: {$totalBills}" . PHP_EOL;
echo "  - Bills đã thanh toán: {$paidBills}" . PHP_EOL;
echo "  - Bills đang chờ: {$pendingBills}" . PHP_EOL . PHP_EOL;

if ($totalBills > 0) {
    echo "📄 DANH SÁCH BILLS (5 mới nhất):" . PHP_EOL;
    $bills = App\Models\Bill::with(['user', 'pricingPlan'])->latest()->take(5)->get();
    
    foreach ($bills as $bill) {
        $userName = $bill->user ? $bill->user->name : 'N/A';
        $planName = $bill->pricingPlan ? $bill->pricingPlan->name : 'N/A';
        
        echo "  Bill #{$bill->id}:" . PHP_EOL;
        echo "    - Status: {$bill->status}" . PHP_EOL;
        echo "    - Amount: \${$bill->amount}" . PHP_EOL;
        echo "    - User: {$userName} (ID: {$bill->user_id})" . PHP_EOL;
        echo "    - Plan: {$planName} (ID: {$bill->pricing_plan_id})" . PHP_EOL;
        echo "    - Created: {$bill->created_at}" . PHP_EOL;
        if ($bill->paid_at) {
            echo "    - Paid at: {$bill->paid_at}" . PHP_EOL;
        }
        echo "    ---" . PHP_EOL;
    }
    
    // Kiểm tra bills đã thanh toán
    if ($paidBills > 0) {
        echo PHP_EOL . "💰 BILLS ĐÃ THANH TOÁN:" . PHP_EOL;
        $paidBillsList = App\Models\Bill::where('status', 'paid')->with(['user', 'pricingPlan'])->get();
        
        foreach ($paidBillsList as $bill) {
            $userName = $bill->user ? $bill->user->name : 'N/A';
            $planName = $bill->pricingPlan ? $bill->pricingPlan->name : 'N/A';
            
            echo "  Bill #{$bill->id}: {$userName} - {$planName} - \${$bill->amount} - Paid: {$bill->paid_at}" . PHP_EOL;
        }
    }
    
} else {
    echo "⚠️  Không có bills nào trong hệ thống" . PHP_EOL;
}

echo PHP_EOL . "=== KẾT THÚC KIỂM TRA ===" . PHP_EOL;
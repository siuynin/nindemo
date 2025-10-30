<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\PricingPlan;

class CheckDuplicatePricingPlanIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pricing-plans:check-duplicates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kiểm tra và hiển thị các ID trùng lặp trong bảng pricing_plans';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Kiểm tra ID trùng lặp trong bảng pricing_plans...');
        
        // Kiểm tra các ID bị trùng
        $duplicates = DB::select('
            SELECT id, COUNT(*) as count 
            FROM pricing_plans 
            GROUP BY id 
            HAVING COUNT(*) > 1 
            ORDER BY id
        ');

        if (!empty($duplicates)) {
            $this->warn('⚠️  Các ID bị trùng lặp:');
            foreach ($duplicates as $duplicate) {
                $this->line("- ID {$duplicate->id}: xuất hiện {$duplicate->count} lần");
            }
        } else {
            $this->info('✅ Không có ID nào bị trùng lặp.');
        }

        $this->info('');
        $this->info('Danh sách tất cả các pricing plans:');
        
        $allPlans = PricingPlan::orderBy('id')->get();
        
        if ($allPlans->isEmpty()) {
            $this->warn('Không có dữ liệu pricing plans.');
        } else {
            foreach ($allPlans as $plan) {
                $this->line("- ID {$plan->id}: {$plan->name} - Price: {$plan->price} - Credits: {$plan->credits} - Credits Included: {$plan->credits_included}");
            }
        }

        $this->info('');
        $this->info("Tổng số pricing plans: {$allPlans->count()}");
        
        // Kiểm tra ID lớn nhất
        $maxId = PricingPlan::max('id');
        $this->info("ID lớn nhất: {$maxId}");

        // Kiểm tra AUTO_INCREMENT
        $autoIncrement = DB::select("SELECT nextval(pg_get_serial_sequence('pricing_plans', 'id')) as next_id")[0]->next_id;
        $this->info("Giá trị AUTO_INCREMENT tiếp theo: {$autoIncrement}");

        return Command::SUCCESS;
    }
}
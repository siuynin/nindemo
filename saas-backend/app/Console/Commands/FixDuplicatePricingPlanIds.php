<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\PricingPlan;

class FixDuplicatePricingPlanIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pricing-plans:fix-duplicates {--dry-run : Chạy thử nghiệm không thực hiện thay đổi}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sửa lỗi ID trùng lặp trong bảng pricing_plans';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('=== CHẾ ĐỘ THỬ NGHIỆM - Không thực hiện thay đổi ===');
        } else {
            $this->info('=== CHẾ ĐỘ THỰC THI - Sẽ thực hiện thay đổi ===');
        }

        $this->info('Tìm và sửa lỗi ID trùng lặp trong bảng pricing_plans...');
        
        // Tìm các ID bị trùng
        $duplicates = DB::select('
            SELECT id, COUNT(*) as count 
            FROM pricing_plans 
            GROUP BY id 
            HAVING COUNT(*) > 1 
            ORDER BY id
        ');

        if (empty($duplicates)) {
            $this->info('✅ Không có ID nào bị trùng lặp.');
            return Command::SUCCESS;
        }

        $this->warn('⚠️  Tìm thấy ID bị trùng lặp:');
        foreach ($duplicates as $duplicate) {
            $this->line("- ID {$duplicate->id}: xuất hiện {$duplicate->count} lần");
        }

        // Lấy ID lớn nhất hiện tại
        $maxId = PricingPlan::max('id');
        $newId = $maxId + 1;

        foreach ($duplicates as $duplicate) {
            $duplicateId = $duplicate->id;
            $count = $duplicate->count;
            
            // Lấy tất cả bản ghi với ID này
            $records = PricingPlan::where('id', $duplicateId)->orderBy('created_at')->get();
            
            // Giữ lại bản ghi đầu tiên, cập nhật các bản ghi còn lại
            $firstRecord = $records->first();
            $recordsToUpdate = $records->slice(1); // Bỏ bản ghi đầu tiên
            
            $this->info("\nXử lý ID {$duplicateId}:");
            $this->line("- Giữ lại: {$firstRecord->name} (ID: {$firstRecord->id})");
            
            foreach ($recordsToUpdate as $record) {
                $this->line("- Cập nhật: {$record->name} từ ID {$record->id} sang ID {$newId}");
                
                if (!$dryRun) {
                    // Cập nhật ID mới
                    DB::table('pricing_plans')
                        ->where('id', $record->id)
                        ->where('name', $record->name) // Đảm bảo cập nhật đúng bản ghi
                        ->update(['id' => $newId]);
                }
                
                $newId++;
            }
        }

        if ($dryRun) {
            $this->info('\n✅ Hoàn thành chạy thử nghiệm. Không có thay đổi nào được thực hiện.');
        } else {
            $this->info('\n✅ Hoàn thành sửa lỗi ID trùng lặp.');
            
            // Kiểm tra lại
            $remainingDuplicates = DB::select('
                SELECT id, COUNT(*) as count 
                FROM pricing_plans 
                GROUP BY id 
                HAVING COUNT(*) > 1
            ');
            
            if (empty($remainingDuplicates)) {
                $this->info('✅ Không còn ID trùng lặp nào.');
                
                // Reset AUTO_INCREMENT để tránh lỗi trong tương lai
                $maxId = PricingPlan::max('id');
                $nextAutoIncrement = $maxId + 1;
                
                // Lấy tên bảng từ model
                $tableName = (new PricingPlan)->getTable();
                
                // Reset AUTO_INCREMENT cho PostgreSQL
                DB::statement("ALTER SEQUENCE {$tableName}_id_seq RESTART WITH {$nextAutoIncrement}");
                
                $this->info("✅ Đã reset AUTO_INCREMENT thành {$nextAutoIncrement}");
            } else {
                $this->error('⚠️  Vẫn còn ID trùng lặp sau khi sửa:');
                foreach ($remainingDuplicates as $duplicate) {
                    $this->line("- ID {$duplicate->id}: xuất hiện {$duplicate->count} lần");
                }
            }
        }

        return Command::SUCCESS;
    }
}
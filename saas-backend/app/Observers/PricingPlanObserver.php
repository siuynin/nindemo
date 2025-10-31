<?php

namespace App\Observers;

use App\Models\PricingPlan;
use Illuminate\Support\Facades\Log;

class PricingPlanObserver
{
    /**
     * Handle the PricingPlan "creating" event.
     */
    public function creating(PricingPlan $pricingPlan): void
    {
        // Nếu ID được cung cấp thủ công, kiểm tra xem có trùng lặp không
        if ($pricingPlan->id) {
            $existingPlan = PricingPlan::find($pricingPlan->id);
            if ($existingPlan) {
                // Tìm ID lớn nhất và tăng lên 1
                $maxId = PricingPlan::max('id') ?? 0;
                $pricingPlan->id = $maxId + 1;
                
                Log::warning('PricingPlan ID trùng lặp được phát hiện và tự động sửa', [
                    'original_id' => $pricingPlan->id,
                    'new_id' => $maxId + 1,
                    'name' => $pricingPlan->name
                ]);
            }
        }
    }

    /**
     * Handle the PricingPlan "updating" event.
     */
    public function updating(PricingPlan $pricingPlan): void
    {
        // Nếu đang cố gắng thay đổi ID, kiểm tra xem ID mới có trùng lặp không
        if ($pricingPlan->isDirty('id')) {
            $existingPlan = PricingPlan::where('id', $pricingPlan->id)
                ->where('id', '!=', $pricingPlan->getOriginal('id'))
                ->first();
                
            if ($existingPlan) {
                // Giữ nguyên ID cũ nếu ID mới bị trùng
                $pricingPlan->id = $pricingPlan->getOriginal('id');
                
                Log::warning('Cố gắng cập nhật PricingPlan với ID trùng lặp bị chặn', [
                    'attempted_id' => $pricingPlan->id,
                    'kept_id' => $pricingPlan->getOriginal('id'),
                    'name' => $pricingPlan->name
                ]);
            }
        }
    }
}
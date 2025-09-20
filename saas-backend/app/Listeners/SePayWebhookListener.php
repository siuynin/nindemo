<?php

namespace App\Listeners;

use App\Models\User;
use SePay\SePay\Events\SePayWebhookEvent;
use Illuminate\Support\Facades\Log;
use App\Models\Bill;

class SePayWebhookListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(SePayWebhookEvent $event): void
    {
        Log::info('SePay Webhook received', ['data' => $event->sePayWebhookData]);
        
        // Xử lý tiền vào tài khoản
        if ($event->sePayWebhookData->transferType === 'in') {
            // Lấy thông tin từ nội dung chuyển khoản
            $content = $event->sePayWebhookData->content;
            
            // Tìm mã đơn hàng trong nội dung (ví dụ: SE123456)
            if (preg_match('/SE(\d+)/', $content, $matches)) {
                $orderId = $matches[1];
                
                // Tìm bill theo order ID
                $bill = Bill::where('id', $orderId)
                    ->where('status', 'pending')
                    ->first();
                    
                if ($bill) {
                    // Kiểm tra số tiền
                    if ($event->sePayWebhookData->transferAmount >= $bill->amount) {
                        // Cập nhật trạng thái bill
                        $bill->update([
                            'status' => 'paid',
                            'payment_method' => 'bank_transfer',
                            'transaction_id' => $event->sePayWebhookData->referenceCode,
                            'paid_at' => now()
                        ]);
                        
                        // Cập nhật subscription cho user
                        $user = User::find($bill->user_id);
                        if ($user) {
                            $user->update([
                                'subscription_plan' => $bill->plan_name,
                                'subscription_expires_at' => now()->addMonth()
                            ]);
                            
                            // Thêm credits cho user từ pricing plan
                            $pricingPlan = $bill->pricingPlan;
                            if ($pricingPlan && $pricingPlan->credits_included > 0) {
                                \App\Models\UserCredit::create([
                                    'user_id' => $user->id,
                                    'pricing_plan_id' => $pricingPlan->id,
                                    'total_credits' => $pricingPlan->credits_included,
                                    'used_credits' => 0,
                                    'remaining_credits' => $pricingPlan->credits_included,
                                    'expires_at' => now()->addDays(31), // 31 ngày từ ngày thanh toán
                                    'credit_type' => 'purchased',
                                    'notes' => "Credits from {$pricingPlan->name} plan purchase via SePay"
                                ]);
                                
                                Log::info('Credits added to user via SePay', [
                                    'user_id' => $user->id,
                                    'plan_id' => $pricingPlan->id,
                                    'credits_added' => $pricingPlan->credits,
                                    'expires_at' => now()->addDays(31)->toDateTimeString()
                                ]);
                            }
                        }
                        
                        Log::info('Payment processed successfully', [
                            'bill_id' => $bill->id,
                            'user_id' => $bill->user_id,
                            'amount' => $event->sePayWebhookData->transferAmount
                        ]);
                    }
                }
            }
        }
    }
}

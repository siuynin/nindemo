<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bill;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SePayController extends Controller
{
    /**
     * Tạo đơn hàng thanh toán chuyển khoản SePay
     */
    public function createOrder(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'currency' => 'required|string',
                'plan_id' => 'required|integer'
            ]);

            // Tạo user giả nếu không có authentication
            $user = Auth::user();
            if (!$user) {
                // Tạo user tạm thời hoặc sử dụng user_id từ request
                $userId = $request->user_id ?? 1; // Default user ID
                $user = User::find($userId);
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found'
                    ], 404);
                }
            }

            // Tạo bill mới
            $bill = Bill::create([
                'user_id' => $user->id,
                'plan_name' => 'Premium Plan',
                'amount' => $request->amount,
                'currency' => $request->currency,
                'status' => 'pending',
                'payment_method' => 'bank_transfer',
                'created_at' => now()
            ]);

            // Thông tin chuyển khoản
            $bankInfo = [
                'bank_name' => 'Ngân Hàng Á Châu - ACB',
                'account_number' => '32495337',
                'account_name' => 'SIU Y NIN',
                'amount' => $request->amount,
                'transfer_content' => 'SE' . $bill->id,
                'qr_code' => $this->generateQRCode($bill)
            ];

            return response()->json([
                'success' => true,
                'order_id' => $bill->id,
                'bank_info' => $bankInfo,
                'message' => 'Đơn hàng đã được tạo thành công'
            ]);

        } catch (\Exception $e) {
            Log::error('SePay create order error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo đơn hàng'
            ], 500);
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán
     */
    public function checkPayment($orderId)
    {
        try {
            $bill = Bill::find($orderId);
            
            if (!$bill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Đơn hàng không tồn tại'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'order_id' => $bill->id,
                'status' => $bill->status,
                'paid_at' => $bill->paid_at,
                'transaction_id' => $bill->transaction_id
            ]);

        } catch (\Exception $e) {
            Log::error('SePay check payment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi kiểm tra thanh toán'
            ], 500);
        }
    }

    /**
     * Xử lý webhook từ SePay
     */
    public function handleWebhook(Request $request)
    {
        try {
            // Log webhook data để debug
            Log::info('SePay webhook received', [
                'headers' => $request->headers->all(),
                'body' => $request->all(),
                'raw_body' => $request->getContent(),
                'ip' => $request->ip(),
                'timestamp' => now()
            ]);

            $data = $request->all();
            
            // Validate required fields
            if (!isset($data['content']) || !isset($data['transferAmount'])) {
                Log::warning('SePay webhook missing required fields', $data);
                return response()->json([
                    'success' => false,
                    'message' => 'Missing required fields'
                ], 400);
            }

            // Extract transaction info from content
            $content = $data['content'];
            $amount = $data['transferAmount'];
            
            // Parse SE{id} from content
            if (preg_match('/SE(\d+)/', $content, $matches)) {
                $billId = $matches[1];
                
                $bill = Bill::find($billId);
                
                if (!$bill) {
                    Log::warning('SePay webhook: Bill not found', ['bill_id' => $billId]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Bill not found'
                    ], 404);
                }

                // Check if amount matches
                if ($amount != $bill->amount) {
                    Log::warning('SePay webhook: Amount mismatch', [
                        'bill_id' => $billId,
                        'expected' => $bill->amount,
                        'received' => $amount
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Amount mismatch'
                    ], 400);
                }

                // Mark bill as paid if it's pending
                if ($bill->status === 'pending') {
                    $bill->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                        'transaction_id' => $data['id'] ?? null,
                        'sepay_response' => $data
                    ]);

                    // Update user's current plan and add credits
                    if ($bill->pricingPlan) {
                        $user = $bill->user;
                        $plan = $bill->pricingPlan;
                        
                        // Update user's current plan
                        $user->update([
                            'current_pricing_plan_id' => $plan->id,
                            'plan_expires_at' => now()->addDays($plan->duration_days ?? 30)
                        ]);
                        
                        // Create new user credit record
                        \App\Models\UserCredit::create([
                            'user_id' => $user->id,
                            'pricing_plan_id' => $plan->id,
                            'total_credits' => $plan->credits ?? 0,
                            'used_credits' => 0,
                            'remaining_credits' => $plan->credits ?? 0,
                            'expires_at' => now()->addDays(31), // 31 days from payment date
                            'credit_type' => 'monthly',
                            'notes' => "Credits from {$plan->name} plan purchase via SePay"
                        ]);
                        
                        Log::info('SePay: User plan activated and credits added', [
                            'user_id' => $user->id,
                            'plan_id' => $plan->id,
                            'credits_added' => $plan->credits,
                            'expires_at' => now()->addDays(31)->toDateTimeString()
                        ]);
                    }

                    Log::info('SePay payment completed', [
                        'bill_id' => $billId,
                        'amount' => $amount,
                        'transaction_id' => $data['id'] ?? null
                    ]);
                } else {
                    Log::info('SePay webhook: Bill already processed', [
                        'bill_id' => $billId,
                        'status' => $bill->status
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Webhook processed successfully'
                ]);

            } else {
                Log::warning('SePay webhook: Cannot extract bill ID from content', ['content' => $content]);
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot extract bill ID from content'
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('SePay webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed'
            ], 500);
        }
    }

    /**
     * Tạo QR code cho chuyển khoản
     */
    private function generateQRCode($bill)
    {
        // Tạo URL QR code cho chuyển khoản ngân hàng
        $qrData = [
            'bank' => 'VCB',
            'account' => '1234567890',
            'amount' => $bill->amount,
            'memo' => 'SE' . $bill->id
        ];
        
        // Trả về URL QR code (có thể sử dụng service tạo QR)
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode(json_encode($qrData));
    }
}

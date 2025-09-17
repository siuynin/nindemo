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

            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
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
                'bank_name' => 'Vietcombank',
                'account_number' => '1234567890',
                'account_name' => 'CONG TY AI APP',
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

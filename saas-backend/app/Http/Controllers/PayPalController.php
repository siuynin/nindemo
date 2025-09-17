<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\User;
use App\Models\PricingPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PayPalController extends Controller
{
    private string $baseUrl;
    private string $clientId;
    private string $clientSecret;

    public function __construct()
    {
        $this->baseUrl = config('services.paypal.mode') === 'sandbox' 
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.client_secret');
    }

    /**
     * Get PayPal access token
     */
    private function getAccessToken(): ?string
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post($this->baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error('PayPal access token error', $response->json());
            return null;
        } catch (\Exception $e) {
            Log::error('PayPal access token exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create PayPal order
     */
    public function createOrder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'plan_id' => 'required|exists:pricing_plans,id',
                'return_url' => 'required|url',
                'cancel_url' => 'required|url'
            ]);

            $user = Auth::user();
            $plan = PricingPlan::findOrFail($request->plan_id);

            // Create bill record
            $bill = Bill::create([
                'user_id' => $user->id,
                'pricing_plan_id' => $plan->id,
                'bill_number' => Bill::generateBillNumber(),
                'amount' => $plan->price,
                'currency' => 'USD',
                'description' => "Payment for {$plan->name} plan",
                'status' => 'pending',
                'payment_method' => 'paypal'
            ]);

            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return response()->json(['error' => 'Unable to get PayPal access token'], 500);
            }

            $orderData = [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => $bill->bill_number,
                    'amount' => [
                        'currency_code' => 'USD',
                        'value' => number_format($plan->price, 2, '.', '')
                    ],
                    'description' => "Payment for {$plan->name} plan"
                ]],
                'application_context' => [
                    'return_url' => $request->return_url,
                    'cancel_url' => $request->cancel_url,
                    'brand_name' => config('app.name'),
                    'landing_page' => 'NO_PREFERENCE',
                    'user_action' => 'PAY_NOW'
                ]
            ];

            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . '/v2/checkout/orders', $orderData);

            if ($response->successful()) {
                $orderResponse = $response->json();
                
                // Update bill with PayPal order ID
                $bill->update([
                    'paypal_order_id' => $orderResponse['id'],
                    'paypal_response' => $orderResponse
                ]);

                return response()->json([
                    'success' => true,
                    'order_id' => $orderResponse['id'],
                    'bill_id' => $bill->id,
                    'approval_url' => collect($orderResponse['links'])
                        ->firstWhere('rel', 'approve')['href'] ?? null
                ]);
            }

            Log::error('PayPal create order error', $response->json());
            $bill->markAsFailed();
            
            return response()->json(['error' => 'Failed to create PayPal order'], 500);

        } catch (\Exception $e) {
            Log::error('PayPal create order exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Capture PayPal order
     */
    public function captureOrder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'order_id' => 'required|string',
                'bill_id' => 'required|exists:bills,id'
            ]);

            $bill = Bill::findOrFail($request->bill_id);
            
            // Verify bill belongs to authenticated user
            if ($bill->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return response()->json(['error' => 'Unable to get PayPal access token'], 500);
            }

            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . "/v2/checkout/orders/{$request->order_id}/capture");

            if ($response->successful()) {
                $captureResponse = $response->json();
                
                if ($captureResponse['status'] === 'COMPLETED') {
                    $captureId = $captureResponse['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
                    
                    // Mark bill as paid with PayPal data
                    $bill->markAsPaid($captureId, [
                        'order_id' => $request->order_id,
                        'capture_id' => $captureId,
                        'response' => $captureResponse
                    ]);

                    // Update user credits based on pricing plan
                    $plan = $bill->pricingPlan;
                    if ($plan) {
                        $user = $bill->user;
                        $user->increment('credits', $plan->credits);
                        
                        Log::info('User credits updated', [
                            'user_id' => $user->id,
                            'credits_added' => $plan->credits,
                            'total_credits' => $user->credits
                        ]);
                    }

                    return response()->json([
                        'success' => true,
                        'message' => 'Payment completed successfully',
                        'bill_id' => $bill->id,
                        'transaction_id' => $captureId
                    ]);
                }
            }

            Log::error('PayPal capture order error', $response->json());
            $bill->markAsFailed();
            
            return response()->json(['error' => 'Failed to capture PayPal order'], 500);

        } catch (\Exception $e) {
            Log::error('PayPal capture order exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Handle PayPal webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            $payload = $request->all();
            Log::info('PayPal webhook received', $payload);

            $eventType = $payload['event_type'] ?? null;
            
            switch ($eventType) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    $this->handlePaymentCaptureCompleted($payload);
                    break;
                    
                case 'PAYMENT.CAPTURE.DENIED':
                case 'PAYMENT.CAPTURE.REFUNDED':
                    $this->handlePaymentFailed($payload);
                    break;
                    
                default:
                    Log::info('Unhandled PayPal webhook event', ['event_type' => $eventType]);
            }

            return response()->json(['status' => 'success']);
            
        } catch (\Exception $e) {
            Log::error('PayPal webhook exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle payment capture completed webhook
     */
    private function handlePaymentCaptureCompleted(array $payload): void
    {
        $captureId = $payload['resource']['id'] ?? null;
        
        if ($captureId) {
            $bill = Bill::where('paypal_capture_id', $captureId)->first();
            
            if ($bill && $bill->isPending()) {
                $bill->markAsPaid($captureId, [
                    'capture_id' => $captureId,
                    'response' => $payload
                ]);
                
                Log::info('Payment completed via webhook', ['bill_id' => $bill->id]);
            }
        }
    }

    /**
     * Handle payment failed webhook
     */
    private function handlePaymentFailed(array $payload): void
    {
        $captureId = $payload['resource']['id'] ?? null;
        
        if ($captureId) {
            $bill = Bill::where('paypal_capture_id', $captureId)->first();
            
            if ($bill && !$bill->isFailed()) {
                $bill->markAsFailed();
                
                Log::info('Payment failed via webhook', ['bill_id' => $bill->id]);
            }
        }
    }

    /**
     * Generate bill number helper method for Bill model
     */
    public static function generateBillNumber(): string
    {
        do {
            $billNumber = 'BILL-' . date('Y') . '-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Bill::where('bill_number', $billNumber)->exists());

        return $billNumber;
    }
}
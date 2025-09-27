<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\PricingPlan;
use App\Models\PayPalTransaction;
use App\Models\UserCredit;

class PayPalController extends Controller
{
    private $paypalBaseUrl;
    private $paypalClientId;
    private $paypalClientSecret;

    public function __construct()
    {
        $this->paypalBaseUrl = config('services.paypal.mode') === 'live' 
            ? 'https://api.paypal.com' 
            : 'https://api.sandbox.paypal.com';
        $this->paypalClientId = config('services.paypal.client_id');
        $this->paypalClientSecret = config('services.paypal.client_secret');
    }

    /**
     * Activate user plan after successful payment
     */
    private function activateUserPlan(User $user, PricingPlan $plan)
    {
        try {
            // Calculate plan expiry date (30 days from now for most plans)
            $expiryDate = now()->addDays($plan->duration_days ?? 30);
            
            // Update user's current plan
            $user->update([
                'current_pricing_plan_id' => $plan->id,
                'plan_expires_at' => $expiryDate
            ]);

            Log::info('User plan activated', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'expires_at' => $expiryDate
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to activate user plan', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get PayPal access token
     */
    private function getAccessToken()
    {
        try {
            $response = Http::withBasicAuth($this->paypalClientId, $this->paypalClientSecret)
                ->asForm()
                ->post($this->paypalBaseUrl . '/v1/oauth2/token', [
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
    public function createOrder(Request $request)
    {
        try {
            $request->validate([
                'plan_id' => 'required|exists:pricing_plans,id',
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'required|string|max:3'
            ]);

            $user = Auth::user();
            $plan = PricingPlan::findOrFail($request->plan_id);

            // Verify amount matches plan price considering currency conversion
            $expectedAmount = $plan->price;
            if ($plan->currency === 'VND' && $request->currency === 'USD') {
                $expectedAmount = round($plan->price / 25000);
            }
            if ((float)$request->amount != (float)$expectedAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount does not match plan price'
                ], 400);
            }

            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get PayPal access token'
                ], 500);
            }

            // Create PayPal order
            $orderData = [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => $request->currency,
                        'value' => number_format($request->amount, 2, '.', '')
                    ],
                    'description' => "AI Credits - {$plan->name} ({$plan->credits} credits)",
                    'custom_id' => "user_{$user->id}_plan_{$plan->id}"
                ]],
                'application_context' => [
                    'return_url' => config('app.frontend_url') . '/payment/success',
                    'cancel_url' => config('app.frontend_url') . '/payment/cancel',
                    'brand_name' => config('app.name'),
                    'landing_page' => 'BILLING',
                    'user_action' => 'PAY_NOW'
                ]
            ];

            $response = Http::withToken($accessToken)
                ->post($this->paypalBaseUrl . '/v2/checkout/orders', $orderData);

            if ($response->successful()) {
                $orderResponse = $response->json();
                
                // Store transaction record
                $transaction = PayPalTransaction::create([
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'paypal_order_id' => $orderResponse['id'],
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                    'status' => 'created',
                    'paypal_response' => $orderResponse
                ]);

                return response()->json([
                    'success' => true,
                    'order_id' => $orderResponse['id'],
                    'bill_id' => $transaction->id,
                    'status' => $orderResponse['status'],
                    'links' => $orderResponse['links']
                ]);
            }

            Log::error('PayPal create order error', $response->json());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create PayPal order',
                'error' => $response->json()
            ], 500);

        } catch (\Exception $e) {
            Log::error('PayPal create order exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Capture PayPal payment
     */
    public function captureOrder(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|string',
                'plan_id' => 'required|exists:pricing_plans,id'
            ]);

            $user = Auth::user();
            $plan = PricingPlan::findOrFail($request->plan_id);
            
            // Find transaction record
            $transaction = PayPalTransaction::where('paypal_order_id', $request->order_id)
                ->where('user_id', $user->id)
                ->where('plan_id', $plan->id)
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            if ($transaction->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction already completed'
                ], 400);
            }

            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get PayPal access token'
                ], 500);
            }

            // Capture PayPal order - PayPal API v2 requires empty JSON object for capture
            $response = Http::withToken($accessToken)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ])
                ->withBody('{}')
                ->post($this->paypalBaseUrl . "/v2/checkout/orders/{$request->order_id}/capture");

            if ($response->successful()) {
                $captureResponse = $response->json();
                
                if ($captureResponse['status'] === 'COMPLETED') {
                    // Update transaction
                    $transaction->update([
                        'status' => 'completed',
                        'paypal_capture_id' => $captureResponse['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                        'completed_at' => now(),
                        'paypal_response' => $captureResponse
                    ]);

                    // Add credits to user
                    $this->addCreditsToUser($user, $plan);
                    
                    // Update user's current plan and expiry date
                    $this->activateUserPlan($user, $plan);

                    return response()->json([
                        'success' => true,
                        'message' => 'Payment completed successfully',
                        'transaction_id' => $transaction->id,
                        'credits_added' => $plan->credits_included,
                        'plan_activated' => $plan->name
                    ]);
                }
            }

            // Update transaction as failed
            $transaction->update([
                'status' => 'failed',
                'paypal_response' => $response->json()
            ]);

            Log::error('PayPal capture order error', $response->json());
            return response()->json([
                'success' => false,
                'message' => 'Failed to capture PayPal payment',
                'error' => $response->json()
            ], 500);

        } catch (\Exception $e) {
            Log::error('PayPal capture order exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add credits to user account
     */
    private function addCreditsToUser(User $user, PricingPlan $plan)
    {
        try {
            // Create new user credit record with proper structure
            if ($plan->credits_included > 0) {
                UserCredit::create([
                    'user_id' => $user->id,
                    'pricing_plan_id' => $plan->id,
                    'total_credits' => $plan->credits_included,
                    'used_credits' => 0,
                    'remaining_credits' => $plan->credits_included,
                    'expires_at' => now()->addDays(31), // 31 days from payment date
                    'credit_type' => 'purchased',
                    'notes' => "Credits from {$plan->name} plan purchase via PayPal"
                ]);

                Log::info('Credits added to user via PayPal', [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'credits_added' => $plan->credits_included,
                    'expires_at' => now()->addDays(31)->toDateTimeString()
                ]);
            } else {
                Log::info('No credits to add - plan has no credits_included', [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to add credits to user via PayPal', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle PayPal webhook
     */
    public function handleWebhook(Request $request)
    {
        try {
            $payload = $request->all();
            Log::info('PayPal webhook received', $payload);

            // Verify webhook signature (implement based on PayPal documentation)
            // For now, we'll just log the webhook

            $eventType = $payload['event_type'] ?? null;
            
            switch ($eventType) {
                case 'CHECKOUT.ORDER.APPROVED':
                    $this->handleOrderApproved($payload);
                    break;
                case 'PAYMENT.CAPTURE.COMPLETED':
                    $this->handlePaymentCompleted($payload);
                    break;
                case 'PAYMENT.CAPTURE.DENIED':
                    $this->handlePaymentDenied($payload);
                    break;
                default:
                    Log::info('Unhandled PayPal webhook event', ['event_type' => $eventType]);
            }

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('PayPal webhook error', [
                'error' => $e->getMessage(),
                'payload' => $request->all()
            ]);
            
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    private function handleOrderApproved($payload)
    {
        // Handle order approved event
        Log::info('PayPal order approved', $payload);
    }

    private function handlePaymentCompleted($payload)
    {
        // Handle payment completed event
        Log::info('PayPal payment completed', $payload);
    }

    private function handlePaymentDenied($payload)
    {
        // Handle payment denied event
        Log::info('PayPal payment denied', $payload);
    }
}
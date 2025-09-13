<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle incoming webhook from external services
     * 
     * @param Request $request
     * @return Response
     */
    public function handleWebhook(Request $request)
    {
        // Log incoming webhook data for debugging
        Log::info('Webhook received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'raw_body' => $request->getContent(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'timestamp' => now()
        ]);

        // Verify webhook signature if needed
        // $this->verifySignature($request);

        // Process webhook data based on type
        $webhookType = $request->header('X-Webhook-Type') ?? $request->input('type');
        
        try {
            switch ($webhookType) {
                case 'payment':
                    return $this->handlePaymentWebhook($request);
                case 'user':
                    return $this->handleUserWebhook($request);
                case 'elevenlabs':
                    return $this->handleElevenLabsWebhook($request);
                default:
                    return $this->handleGenericWebhook($request);
            }
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Webhook processing failed'
            ], 500);
        }
    }

    /**
     * Handle payment related webhooks
     */
    private function handlePaymentWebhook(Request $request)
    {
        $data = $request->all();
        
        // Process payment webhook
        Log::info('Processing payment webhook', $data);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Payment webhook processed successfully'
        ]);
    }

    /**
     * Handle user related webhooks
     */
    private function handleUserWebhook(Request $request)
    {
        $data = $request->all();
        
        // Process user webhook
        Log::info('Processing user webhook', $data);
        
        return response()->json([
            'status' => 'success',
            'message' => 'User webhook processed successfully'
        ]);
    }

    /**
     * Handle ElevenLabs webhooks
     */
    private function handleElevenLabsWebhook(Request $request)
    {
        $data = $request->all();
        
        // Process ElevenLabs webhook (e.g., voice generation completed)
        Log::info('Processing ElevenLabs webhook', $data);
        
        return response()->json([
            'status' => 'success',
            'message' => 'ElevenLabs webhook processed successfully'
        ]);
    }

    /**
     * Handle generic webhooks
     */
    private function handleGenericWebhook(Request $request)
    {
        $data = $request->all();
        
        // Process generic webhook
        Log::info('Processing generic webhook', $data);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Generic webhook processed successfully',
            'received_data' => $data
        ]);
    }

    /**
     * Verify webhook signature (example implementation)
     */
    private function verifySignature(Request $request)
    {
        $signature = $request->header('X-Signature');
        $payload = $request->getContent();
        $secret = config('app.webhook_secret', 'your-webhook-secret');
        
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        
        if (!hash_equals($signature, $expectedSignature)) {
            abort(401, 'Invalid webhook signature');
        }
    }

    /**
     * Test endpoint for webhook testing
     */
    public function test(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Webhook endpoint is working!',
            'timestamp' => now(),
            'received_data' => $request->all()
        ]);
    }
}
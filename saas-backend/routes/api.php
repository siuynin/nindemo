<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/login', [App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/google-login', [App\Http\Controllers\Api\AuthController::class, 'googleLogin']);
Route::post('/forgot-password', [App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [App\Http\Controllers\Api\AuthController::class, 'resetPassword']);

// Public pricing plans
Route::get('/pricing-plans', [App\Http\Controllers\Api\PricingPlanController::class, 'index']);

// Public voices from ElevenLabs
Route::get('/public-voices', [App\Http\Controllers\Api\VoiceController::class, 'index']);
Route::get('/public-voices/{id}', [App\Http\Controllers\Api\VoiceController::class, 'show']);

// Public generates (images/content with share = 'public')
Route::get('/public-generates', [App\Http\Controllers\Api\PublicGenerateController::class, 'index']);
Route::get('/public-generates/{id}', [App\Http\Controllers\Api\PublicGenerateController::class, 'show']);

// Minimax voices API
Route::get('/minimax/voices', [App\Http\Controllers\Api\MinimaxController::class, 'getVoices']);

// ElevenLabs webhook
Route::post('/getaudio', [App\Http\Controllers\Api\ElevenLabsWebhookController::class, 'handleWebhook']);

// Debug route
Route::get('/debug/generates', function() {
    $generates = App\Models\Generate::all();
    return response()->json([
        'generates' => $generates->map(function($g) {
            return [
                'id' => $g->id,
                'user_id' => $g->user_id,
                'status' => $g->status,
                'result_url' => $g->result_url
            ];
        })
    ]);
});

// Debug users route
Route::get('/debug/users', function() {
    $users = App\Models\User::all(['id', 'name', 'email']);
    return response()->json([
        'users' => $users
    ]);
});

// Debug current user route
Route::middleware('auth:sanctum')->get('/debug/current-user', function(Request $request) {
    $user = Auth::user();
    return response()->json([
        'user_id' => $user->id,
        'user_email' => $user->email,
        'user_name' => $user->name
    ]);
});

// Debug user generates
Route::middleware('auth:sanctum')->get('/debug/my-generates', function(Request $request) {
    $user = Auth::user();
    $generates = App\Models\Generate::where('user_id', $user->id)->get(['id', 'user_id', 'status', 'result_url', 'name']);
    return response()->json([
        'current_user_id' => $user->id,
        'generates' => $generates
    ]);
});

// Webhook endpoints for testing
Route::prefix('webhooks')->group(function () { 
    Route::post('/handle', [App\Http\Controllers\WebhookController::class, 'handleWebhook']);
    Route::post('/payment', [App\Http\Controllers\WebhookController::class, 'handleWebhook']);
    Route::post('/user', [App\Http\Controllers\WebhookController::class, 'handleWebhook']);
    Route::post('/elevenlabs', [App\Http\Controllers\WebhookController::class, 'handleWebhook']);
    Route::post('/paypal', [App\Http\Controllers\Api\PayPalController::class, 'handleWebhook']);
});

// Public AI Models routes
Route::prefix('models')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\ModelController::class, 'index']);
    Route::get('/featured', [App\Http\Controllers\Api\ModelController::class, 'featured']);
    Route::get('/filters', [App\Http\Controllers\Api\ModelController::class, 'filters']);
    Route::get('/platform/{platform}', [App\Http\Controllers\Api\ModelController::class, 'byPlatform']);
    Route::get('/type/{type}', [App\Http\Controllers\Api\ModelController::class, 'byType']);
    Route::get('/{slug}', [App\Http\Controllers\Api\ModelController::class, 'show']);
    Route::get('/{slug}/credit-price', [App\Http\Controllers\Api\ModelController::class, 'getCreditPrice']);

});

// Public OpenAI Templates routes (for viewing templates without authentication)
Route::prefix('openai-templates')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\OpenAIController::class, 'index']);
    Route::get('/filter-options', [App\Http\Controllers\Api\OpenAIController::class, 'filterOptions']);
    Route::get('/{id}', [App\Http\Controllers\Api\OpenAIController::class, 'show']);
    Route::get('/type/{type}', [App\Http\Controllers\Api\OpenAIController::class, 'byType']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/user', [App\Http\Controllers\Api\AuthController::class, 'user']);
    Route::put('/user/profile', [App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::put('/user/password', [App\Http\Controllers\Api\AuthController::class, 'updatePassword']);
    
    // User credits
    Route::get('/user/credits', [App\Http\Controllers\Api\UserCreditController::class, 'index']);
    Route::get('/user/credits/summary', [App\Http\Controllers\Api\UserCreditController::class, 'summary']);
    Route::post('/user/credits/deduct', [App\Http\Controllers\Api\UserCreditController::class, 'deductCredits']);
    Route::post('/user/credits/add', [App\Http\Controllers\Api\UserCreditController::class, 'addCredits']);
    Route::post('/user/credits/refund', [App\Http\Controllers\Api\UserCreditController::class, 'refundCredits']);
    
    // Pricing Plans Management (Admin only)
    Route::apiResource('pricing-plans', App\Http\Controllers\Api\PricingPlanController::class)->except(['index']);
    
    // File management
    Route::apiResource('files', App\Http\Controllers\Api\FileController::class);
    Route::post('/files/{file}/download', [App\Http\Controllers\Api\FileController::class, 'download']);
    
    // OpenAI Templates (protected routes for CRUD operations)
    Route::prefix('openai-templates')->group(function () {
        Route::post('/', [App\Http\Controllers\Api\OpenAIController::class, 'store']);
        Route::put('/{id}', [App\Http\Controllers\Api\OpenAIController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\Api\OpenAIController::class, 'destroy']);
        Route::get('/user/{userId}', [App\Http\Controllers\Api\OpenAIController::class, 'byUser']);
    });
    
    // User Generates Management
    Route::prefix('generates')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\UserGenerateController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\UserGenerateController::class, 'store']);
        Route::get('/statistics', [App\Http\Controllers\Api\UserGenerateController::class, 'statistics']);
        Route::get('/types', [App\Http\Controllers\Api\UserGenerateController::class, 'types']);
         Route::get('/{id}', [App\Http\Controllers\Api\UserGenerateController::class, 'show']);
         Route::put('/{id}', [App\Http\Controllers\Api\UserGenerateController::class, 'update']);
         Route::delete('/{id}', [App\Http\Controllers\Api\UserGenerateController::class, 'destroy']);
         Route::get('/{id}/download', [App\Http\Controllers\Api\UserGenerateController::class, 'download']);
     });
    
    // Bills Management
    Route::prefix('bills')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\BillController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\BillController::class, 'store']);
        Route::get('/stats', [App\Http\Controllers\Api\BillController::class, 'stats']);
        Route::get('/{id}', [App\Http\Controllers\Api\BillController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\Api\BillController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\Api\BillController::class, 'destroy']);
    });
    
    // PayPal Payment Management
    Route::prefix('paypal')->group(function () {
        Route::post('/create-order', [App\Http\Controllers\Api\PayPalController::class, 'createOrder']);
        Route::post('/capture-order', [App\Http\Controllers\Api\PayPalController::class, 'captureOrder']);
    });

    // Image Generation Routes
    Route::prefix('images')->group(function () {
        Route::post('/create-image', [App\Http\Controllers\Api\ImageGenerationController::class, 'createImage']);
        Route::get('/generation/{id}', [App\Http\Controllers\Api\ImageGenerationController::class, 'getGenerationStatus']);
        Route::post('/upscale', [App\Http\Controllers\Api\ImageGenerationController::class, 'upscaleImage']);
    });

    // Video Generation Routes
    Route::prefix('video')->group(function () {
        Route::post('/generate', [App\Http\Controllers\Api\VideoGenerationController::class, 'generateVideo']);
        Route::get('/generation/{id}', [App\Http\Controllers\Api\VideoGenerationController::class, 'getGenerationStatus']);
        Route::get('/generations', [App\Http\Controllers\Api\VideoGenerationController::class, 'getUserGenerations']);
    });
    
    // AI Text Processing Routes
    Route::prefix('ai')->group(function () {
        Route::post('/process-text', [App\Http\Controllers\Api\AIProcessController::class, 'processText']);
        Route::post('/process-text-gemini', [App\Http\Controllers\Api\AIProcessController::class, 'processTextGemini']);
    });
    
    // Voice Clone Routes
    Route::prefix('voice-clones')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\VoiceCloneController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\VoiceCloneController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\Api\VoiceCloneController::class, 'show']);
        Route::delete('/{id}', [App\Http\Controllers\Api\VoiceCloneController::class, 'destroy']);
    });
    
    // Note: Admin functionality is handled through web routes with Blade views
    // This API is specifically designed for frontend application consumption
});

// SePay Bank Transfer Payment Management (Public routes to avoid CORS issues)
Route::prefix('sepay')->group(function () {
    Route::post('/create-order', [App\Http\Controllers\Api\SePayController::class, 'createOrder']);
    Route::get('/check-payment/{orderId}', [App\Http\Controllers\Api\SePayController::class, 'checkPayment']);
    Route::post('/webhook', [App\Http\Controllers\Api\SePayController::class, 'handleWebhook'])->middleware('ngrok.bypass');
});

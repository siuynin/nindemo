<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
Route::post('/forgot-password', [App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [App\Http\Controllers\Api\AuthController::class, 'resetPassword']);

// Public pricing plans
Route::get('/pricing-plans', [App\Http\Controllers\Api\PricingPlanController::class, 'index']);

// ElevenLabs webhook
Route::post('/getaudio', [App\Http\Controllers\Api\ElevenLabsWebhookController::class, 'handleWebhook']);

// Public AI Models routes
Route::prefix('models')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\ModelController::class, 'index']);
    Route::get('/featured', [App\Http\Controllers\Api\ModelController::class, 'featured']);
    Route::get('/filters', [App\Http\Controllers\Api\ModelController::class, 'filters']);
    Route::get('/platform/{platform}', [App\Http\Controllers\Api\ModelController::class, 'byPlatform']);
    Route::get('/type/{type}', [App\Http\Controllers\Api\ModelController::class, 'byType']);
    Route::get('/{slug}', [App\Http\Controllers\Api\ModelController::class, 'show']);
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
     });
    
    // Note: Admin functionality is handled through web routes with Blade views
    // This API is specifically designed for frontend application consumption
});
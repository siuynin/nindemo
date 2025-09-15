<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\PricingPlanController;
use App\Http\Controllers\Admin\UserCreditController;
use App\Http\Controllers\Admin\AIModelController;
use App\Http\Controllers\Admin\AdminOpenAIController;
use App\Http\Controllers\Admin\GenerateController;
use App\Http\Controllers\Admin\BillController;
use App\Http\Controllers\VoiceController;

/*
|--------------------------------------------------------------------------
| Admin Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register admin web routes for your application.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

// Admin Dashboard
Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    
    // Pricing Plans Management
    Route::resource('pricing-plans', PricingPlanController::class);
    
    // User Credits Management
    Route::resource('user-credits', UserCreditController::class);
    Route::get('users/{user}/credits', [UserCreditController::class, 'userCredits'])->name('users.credits');
    Route::post('users/{user}/credits/add', [UserCreditController::class, 'addCredits'])->name('users.credits.add');
    
    // AI Models Management
    Route::resource('models', AIModelController::class);
    
    // OpenAI Templates Management
    Route::resource('openai', AdminOpenAIController::class);
    
    // Users Management
    Route::get('users', [AdminController::class, 'users'])->name('users.index');
    Route::get('users/{user}', [AdminController::class, 'userShow'])->name('users.show');
    Route::patch('users/{user}/role', [AdminController::class, 'updateUserRole'])->name('users.role.update');
    
    // Files Management
    Route::get('files', [AdminController::class, 'files'])->name('files.index');
    Route::delete('files/{file}', [AdminController::class, 'deleteFile'])->name('files.destroy');
    
    // Generate Management
    Route::resource('generates', GenerateController::class);
    
    // Voice Management
    Route::resource('voices', VoiceController::class);
    
    // Bills Management
    Route::resource('bills', BillController::class);
    Route::patch('bills/{bill}/mark-paid', [BillController::class, 'markAsPaid'])->name('bills.mark-paid');
    Route::patch('bills/{bill}/mark-failed', [BillController::class, 'markAsFailed'])->name('bills.mark-failed');
    
    // Statistics
    Route::get('statistics', [AdminController::class, 'statistics'])->name('statistics');
});
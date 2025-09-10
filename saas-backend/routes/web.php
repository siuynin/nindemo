<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OpenAIController;

Route::get('/', function () {
    return view('welcome');
});

// Authentication Routes
Auth::routes();

// Admin Routes
require __DIR__.'/admin.php';

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

// OpenAI CRUD Routes
Route::resource('openai', OpenAIController::class);

<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/register', [RegisterController::class, 'register']);

    // OAuth Routes
    Route::get('/{provider}', [RegisterController::class, 'redirectToProvider'])
        ->where('provider', 'google|facebook');
    Route::get('/{provider}/callback', [RegisterController::class, 'handleProviderCallback'])
        ->where('provider', 'google|facebook');
});

// Protected Auth Routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Customer Protected Routes
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
    Route::get('/profile', [\App\Http\Controllers\Customer\CustomerController::class, 'profile']);
    Route::patch('/profile', [\App\Http\Controllers\Customer\CustomerController::class, 'updateProfile']);
});

// Example of role-protected route
Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/test', function () {
    return response()->json(['message' => 'Admin access granted']);
});

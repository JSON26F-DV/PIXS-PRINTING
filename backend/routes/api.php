<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\ProductController;
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

// User Profile Routes
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile', [UserController::class, 'profile']);
});

// Customer Protected Routes
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
    Route::get('/profile', [CustomerController::class, 'profile']);
    Route::patch('/profile', [CustomerController::class, 'updateProfile']);

    // Contacts
    Route::post('/contacts', [CustomerController::class, 'storeContact']);
    Route::post('/contacts/{number}/default', [CustomerController::class, 'setDefaultContact']);

    // Addresses
    Route::get('/addresses', [CustomerController::class, 'addresses']);
    Route::post('/addresses', [CustomerController::class, 'storeAddress']);
    Route::patch('/addresses/{id}', [CustomerController::class, 'updateAddress']);
    Route::delete('/addresses/{id}', [CustomerController::class, 'deleteAddress']);
    Route::post('/addresses/{id}/default', [CustomerController::class, 'setDefaultAddress']);

    // Payment Methods
    Route::get('/payment-methods', [CustomerController::class, 'paymentMethods']);
    Route::post('/payment-methods', [CustomerController::class, 'storePaymentMethod']);
    Route::delete('/payment-methods/{id}', [CustomerController::class, 'deletePaymentMethod']);
    Route::post('/payment-methods/{id}/default', [CustomerController::class, 'setDefaultPaymentMethod']);

    // Promotions / Awards
    Route::get('/awards', [CustomerController::class, 'promotions']);
    Route::post('/awards/redeem', [CustomerController::class, 'redeemPromotion']);
});

// Messaging
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/messages/send', [\App\Http\Controllers\MessageController::class, 'store']);
});

// Example of role-protected route
Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/test', function () {
    return response()->json(['message' => 'Admin access granted']);
});

Route::middleware(['throttle:api'])->group(function () {
    Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:search');
    Route::get('/products/search', [ProductController::class, 'search'])->middleware(['auth:sanctum', 'throttle:search']);
    Route::get('/products/sold-counts', [ProductController::class, 'soldCounts']);
});

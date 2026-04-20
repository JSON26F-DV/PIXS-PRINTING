<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Customer\CustomerScreenplateController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ScreenplateRequestController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\DeliveryMethodController;
use Illuminate\Support\Facades\Route;

// Public Data Routes
Route::get('/delivery-methods', [DeliveryMethodController::class, 'index']);


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

    // Screenplates (owner rows in `screenplates`)
    Route::get('/screenplates', [CustomerScreenplateController::class, 'index']);

    // Screenplate Requests
    Route::post('/screenplate-requests', [ScreenplateRequestController::class, 'store']);

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
});

// Messaging
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/messages/send', [MessageController::class, 'store']);
});

// Example of role-protected route
Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/test', function () {
    return response()->json(['message' => 'Admin access granted']);
});

// Cart Routes
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/', [CartController::class, 'store']);
    Route::patch('/{id}', [CartController::class, 'update']);
    Route::delete('/{id}', [CartController::class, 'destroy']);
});

Route::middleware(['throttle:api'])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:search');
    Route::get('/products/search', [ProductController::class, 'search'])->middleware(['auth:sanctum', 'throttle:search']);
    Route::get('/products/sold-counts', [ProductController::class, 'soldCounts']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/colors', [ColorController::class, 'index']);
});

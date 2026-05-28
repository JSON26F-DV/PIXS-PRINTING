<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Customer\CustomerScreenplateController;
use App\Http\Controllers\DeliveryMethodController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ScreenplateRequestController;
use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

// ... (skipping some lines for brevity if needed, but I'll replace the block)

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
    Route::patch('/payment-methods/{id}', [CustomerController::class, 'updatePaymentMethod']);
    Route::delete('/payment-methods', [CustomerController::class, 'deleteAllPaymentMethods']);
    Route::delete('/payment-methods/{id}', [CustomerController::class, 'deletePaymentMethod']);
    Route::post('/payment-methods/{id}/default', [CustomerController::class, 'setDefaultPaymentMethod']);

    // Promotions / Awards
    Route::get('/awards', [CustomerController::class, 'promotions']);
    Route::post('/awards/redeem', [CustomerController::class, 'redeemPromotion']);

    // Screenplates (owner rows in `screenplates`)
    Route::get('/screenplates', [CustomerScreenplateController::class, 'index']);

    // Screenplate Requests
    Route::get('/screenplate-requests', [ScreenplateRequestController::class, 'index']);
    Route::post('/screenplate-requests', [ScreenplateRequestController::class, 'store']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::patch('/orders/{id}', [OrderController::class, 'update']);

    // Discounts
    Route::get('/discounts/mine', [DiscountController::class, 'mine']);
    Route::post('/discounts/verify', [DiscountController::class, 'verify']);
});

// Admin Routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Discount Management
    Route::get('/discounts', [DiscountController::class, 'index'])->middleware('role:admin');
    Route::post('/discounts', [DiscountController::class, 'store'])->middleware('role:admin');

    // Dashboard
    Route::get('/dashboard-stats', [AdminDashboardController::class, 'index'])->middleware('role:admin');

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('role:admin');
    Route::patch('/orders/{id}/status', [AdminDashboardController::class, 'updateOrderStatus'])->middleware('role:admin');

    // Product Management
    Route::get('/products', [ProductController::class, 'adminIndex'])->middleware('role:admin');
    Route::get('/products/{id}', [ProductController::class, 'adminShow'])->middleware('role:admin');
    Route::get('/products/{id}/gallery', [ProductController::class, 'showGallery'])->middleware('role:admin');
    Route::get('/products/{id}/tags', [ProductController::class, 'showTags'])->middleware('role:admin');
    Route::get('/products/{id}/variants', [ProductController::class, 'showVariants'])->middleware('role:admin');
    Route::post('/products', [ProductController::class, 'store'])->middleware('role:admin');
    Route::patch('/products/{id}', [ProductController::class, 'update'])->middleware('role:admin');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('role:admin');

    // Category Management
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('role:admin');
    Route::patch('/categories/{id}', [CategoryController::class, 'update'])->middleware('role:admin');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('role:admin');
});

// Messaging & Notifications
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/image-count', [MessageController::class, 'getImageUploadCount']);
    Route::post('/messages/send', [MessageController::class, 'store']);
    Route::patch('/messages/mark-read', [MessageController::class, 'markConversationAsRead']);
    Route::patch('/messages/{id}/confirm', [MessageController::class, 'confirmMessage']);

    // Notifications
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});

// Example of role-protected route
Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/test', function () {
    return response()->json(['message' => 'Admin access granted']);
});

// Cart Routes
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/', [CartController::class, 'store']);
    Route::post('/buy-now', [CartController::class, 'buyNow']);
    Route::patch('/{id}', [CartController::class, 'update']);
    Route::delete('/{id}', [CartController::class, 'destroy']);
});

// Settings Utility Routes
Route::middleware(['auth:sanctum', 'role:customer'])->prefix('settings')->group(function () {
    Route::post('/profile-picture', [CustomerController::class, 'updateProfilePicture']);
    Route::patch('/password', [CustomerController::class, 'updatePassword']);
});

Route::middleware(['throttle:api'])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:search');
    Route::get('/products/search', [ProductController::class, 'search'])->middleware(['auth:sanctum', 'throttle:search']);
    Route::get('/products/sold-counts', [ProductController::class, 'soldCounts']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/colors', [ColorController::class, 'index']);
});

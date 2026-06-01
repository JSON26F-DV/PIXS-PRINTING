<?php

use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AdminCustomerController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminPaymentCodeController;
use App\Http\Controllers\Admin\AdminPayrollController;
use App\Http\Controllers\Admin\AdminScreenplateController;
use App\Http\Controllers\Admin\AdminScreenplateRequestController;
use App\Http\Controllers\Admin\AdminStockAnalyticsController;
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
    // Accounts
    Route::get('/accounts', [AdminAccountController::class, 'index'])->middleware('role:admin');
    Route::get('/accounts/employee/{id}', [AdminAccountController::class, 'showEmployee'])->middleware('role:admin');
    Route::put('/accounts/employee/{id}', [AdminAccountController::class, 'updateEmployee'])->middleware('role:admin');
    Route::get('/accounts/customer/{id}', [AdminAccountController::class, 'showCustomer'])->middleware('role:admin');
    Route::put('/accounts/customer/{id}', [AdminAccountController::class, 'updateCustomer'])->middleware('role:admin');
    Route::delete('/accounts/delete/{id}', [AdminAccountController::class, 'deleteAccount'])->middleware('role:admin');
    Route::post('/accounts/upload-profile-picture', [AdminAccountController::class, 'uploadProfilePicture'])->middleware('role:admin');
    Route::post('/accounts/employee/{id}/assignments', [AdminAccountController::class, 'updateAssignments'])->middleware('role:admin');

    // Customers
    Route::get('/customers', [AdminCustomerController::class, 'index'])->middleware('role:admin');

    // Screenplates
    Route::get('/screenplates', [AdminScreenplateController::class, 'index'])->middleware('role:admin');
    Route::get('/screenplates/{id}', [AdminScreenplateController::class, 'show'])->middleware('role:admin');
    Route::post('/screenplates', [AdminScreenplateController::class, 'store'])->middleware('role:admin');
    Route::patch('/screenplates/{id}', [AdminScreenplateController::class, 'update'])->middleware('role:admin');
    Route::delete('/screenplates/{id}', [AdminScreenplateController::class, 'destroy'])->middleware('role:admin');
    Route::post('/screenplates/{id}/upload-image', [AdminScreenplateController::class, 'uploadImage'])->middleware('role:admin');

    // Compatibility / Incompatible single-row endpoints
    Route::post('/screenplates/{id}/compatibility', [AdminScreenplateController::class, 'addCompatibility'])->middleware('role:admin');
    Route::delete('/screenplates/{id}/compatibility', [AdminScreenplateController::class, 'removeCompatibility'])->middleware('role:admin');
    Route::post('/screenplates/{id}/incompatible', [AdminScreenplateController::class, 'addIncompatible'])->middleware('role:admin');
    Route::delete('/screenplates/{id}/incompatible', [AdminScreenplateController::class, 'removeIncompatible'])->middleware('role:admin');

    // Screenplate Requests & Visibility
    Route::get('/screenplate-requests', [AdminScreenplateRequestController::class, 'index'])->middleware('role:admin');
    Route::patch('/screenplate-requests/{id}/status', [AdminScreenplateRequestController::class, 'updateStatus'])->middleware('role:admin');
    Route::patch('/products/{id}/screenplate-visibility', [AdminScreenplateRequestController::class, 'updateProductVisibility'])->middleware('role:admin');
    Route::patch('/variants/{id}/screenplate-visibility', [AdminScreenplateRequestController::class, 'updateVariantVisibility'])->middleware('role:admin');

    // Discount Management
    Route::get('/discounts', [DiscountController::class, 'index'])->middleware('role:admin');
    Route::post('/discounts', [DiscountController::class, 'store'])->middleware('role:admin');
    Route::put('/discounts/{id}', [DiscountController::class, 'update'])->middleware('role:admin');
    Route::delete('/discounts/{id}', [DiscountController::class, 'destroy'])->middleware('role:admin');

    // Dashboard
    Route::get('/dashboard-stats', [AdminDashboardController::class, 'index'])->middleware('role:admin,staff,technician,inventory');

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('role:admin,staff,technician,inventory');
    Route::post('/orders/direct', [AdminOrderController::class, 'storeDirect'])->middleware('role:admin');
    Route::patch('/orders/{id}/status', [AdminDashboardController::class, 'updateOrderStatus'])->middleware('role:admin');
    Route::delete('/orders/{id}', [AdminOrderController::class, 'destroy'])->middleware('role:admin');

    // Product Management
    Route::get('/products', [ProductController::class, 'adminIndex'])->middleware('role:admin,staff,technician,inventory');
    Route::get('/products/{id}', [ProductController::class, 'adminShow'])->middleware('role:admin,staff,technician,inventory');
    Route::get('/products/{id}/gallery', [ProductController::class, 'showGallery'])->middleware('role:admin,staff,technician,inventory');
    Route::get('/products/{id}/tags', [ProductController::class, 'showTags'])->middleware('role:admin,staff,technician,inventory');
    Route::get('/products/{id}/variants', [ProductController::class, 'showVariants'])->middleware('role:admin,staff,technician,inventory');
    Route::post('/products', [ProductController::class, 'store'])->middleware('role:admin');
    Route::patch('/products/{id}', [ProductController::class, 'update'])->middleware('role:admin');
    Route::get('/products/{id}/delete-info', [ProductController::class, 'deleteInfo'])->middleware('role:admin');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('role:admin');

    // Category Management
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('role:admin');
    Route::patch('/categories/{id}', [CategoryController::class, 'update'])->middleware('role:admin');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('role:admin');

    // Stock Analytics & Expenditures
    Route::get('/stock-analytics', [AdminStockAnalyticsController::class, 'index'])->middleware('role:admin,inventory');
    Route::post('/expenditures', [AdminStockAnalyticsController::class, 'storeExpenditure'])->middleware('role:admin,inventory');
    Route::patch('/expenditures/{id}', [AdminStockAnalyticsController::class, 'updateExpenditure'])->middleware('role:admin,inventory');
    Route::delete('/expenditures/{id}', [AdminStockAnalyticsController::class, 'destroyExpenditure'])->middleware('role:admin,inventory');
    Route::post('/products/variants/{variant_id}/stock', [AdminStockAnalyticsController::class, 'updateVariantStock'])->middleware('role:admin,inventory');
    Route::post('/inventory-logs/{id}/undo', [AdminStockAnalyticsController::class, 'undoLog'])->middleware('role:admin,inventory');

    // Payroll & Attendance
    Route::get('/payroll/today', [AdminPayrollController::class, 'today'])->middleware('role:admin');
    Route::post('/payroll/holiday', [AdminPayrollController::class, 'holiday'])->middleware('role:admin');

    // Manage specific employee attendance
    Route::get('/payroll/manage/{id}', [AdminPayrollController::class, 'manageShow'])->middleware('role:admin');
    Route::post('/payroll/manage/{id}', [AdminPayrollController::class, 'manageStore'])->middleware('role:admin');
    Route::patch('/payroll/manage/{id}/{date}/break', [AdminPayrollController::class, 'manageBreak'])->middleware('role:admin');
    Route::delete('/payroll/manage/{id}/{date}', [AdminPayrollController::class, 'manageDestroy'])->middleware('role:admin');

    // Payment Codes Management
    Route::get('/payment-codes', [AdminPaymentCodeController::class, 'index'])->middleware('role:admin');
    Route::post('/payment-codes', [AdminPaymentCodeController::class, 'store'])->middleware('role:admin');
    Route::delete('/payment-codes/{id}', [AdminPaymentCodeController::class, 'destroy'])->middleware('role:admin');

    // Refunds
    Route::get('/refunds', [\App\Http\Controllers\Admin\RefundController::class, 'index'])->middleware('role:admin');
    Route::post('/refunds', [\App\Http\Controllers\Admin\RefundController::class, 'store'])->middleware('role:admin');
    Route::get('/refunds/{id}', [\App\Http\Controllers\Admin\RefundController::class, 'show'])->middleware('role:admin');
    Route::patch('/refunds/{id}', [\App\Http\Controllers\Admin\RefundController::class, 'update'])->middleware('role:admin');
    Route::delete('/refunds/{id}', [\App\Http\Controllers\Admin\RefundController::class, 'destroy'])->middleware('role:admin');
    Route::get('/customers/{id}/payment-methods', [\App\Http\Controllers\Admin\RefundController::class, 'customerPaymentMethods'])->middleware('role:admin');

    // Expenditures (Handled fully inside AdminStockAnalyticsController above)
    // Route::get('/expenditures', [\App\Http\Controllers\Admin\ExpenditureController::class, 'index'])->middleware('role:admin');
    // Route::post('/expenditures', [\App\Http\Controllers\Admin\ExpenditureController::class, 'store'])->middleware('role:admin');
    // Route::patch('/expenditures/{id}', [\App\Http\Controllers\Admin\ExpenditureController::class, 'update'])->middleware('role:admin');
    // Route::delete('/expenditures/{id}', [\App\Http\Controllers\Admin\ExpenditureController::class, 'destroy'])->middleware('role:admin');
});

// Messaging & Notifications
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/users', [MessageController::class, 'getUsers']);
    Route::get('/messages/orders/{id}', [MessageController::class, 'getOrderContext']);
    Route::get('/messages/screenplate-requests/{id}', [MessageController::class, 'getScreenplateRequestContext']);
    Route::get('/messages/expenditures/{id}', [MessageController::class, 'getExpenditureContext']);
    Route::get('/messages/refunds/{id}', [MessageController::class, 'getRefundContext']);
    Route::get('/messages/image-count', [MessageController::class, 'getImageUploadCount']);
    Route::post('/messages/send', [MessageController::class, 'store']);
    Route::post('/messages/{id}/react', [MessageController::class, 'reactMessage']);
    Route::patch('/messages/mark-read', [MessageController::class, 'markConversationAsRead']);
    Route::patch('/messages/{id}/confirm', [MessageController::class, 'confirmMessage']);

    // Admin/Sender Messaging Controls
    Route::put('/messages/{id}', [MessageController::class, 'update']);
    Route::delete('/messages/conversation/{targetId}', [MessageController::class, 'destroyConversation']);
    Route::delete('/messages/{id}/attachments/{filename}', [MessageController::class, 'destroyAttachment']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
    Route::patch('/messages/{id}/pin', [MessageController::class, 'togglePin']);
    Route::patch('/messages/{id}/payment-code', [MessageController::class, 'managePaymentCode']);
    Route::patch('/messages/{id}/refund', [MessageController::class, 'attachRefund']);

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

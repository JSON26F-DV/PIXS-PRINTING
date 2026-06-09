<?php

use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\AdminCustomerController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminPaymentCodeController;
use App\Http\Controllers\Admin\AdminPayrollController;
use App\Http\Controllers\Admin\AdminScreenplateController;
use App\Http\Controllers\Admin\AdminScreenplateRequestController;
use App\Http\Controllers\Admin\AdminStockAnalyticsController;
use App\Http\Controllers\Admin\AdminVerificationController;
use App\Http\Controllers\Admin\RefundController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\PasswordChangeNotificationController;
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
use App\Http\Controllers\StaffLiveQueueController;
use App\Http\Controllers\User\UserController;
use App\Models\Notification;
use App\Models\Order;
use App\Services\AuditService;
use GlennRaya\Xendivel\Xendivel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

// Public Data Routes
Route::get('/delivery-methods', [DeliveryMethodController::class, 'index']);

// Xendit Webhooks
Route::post('/xendit/invoice-webhook', function (Request $request) {
    $token = $request->header('x-callback-token');
    if ($token !== config('xendivel.webhook_verification_token')) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $data = $request->all();
    logger('Xendit Invoice Webhook received: ', $data);

    $status = $data['status'] ?? null;
    $externalId = $data['external_id'] ?? null;

    if (($status === 'PAID' || $status === 'SETTLED') && $externalId) {
        // New flow: Try to find pending order data in cache
        $pendingData = Cache::get("pending_order_{$externalId}");

        if ($pendingData) {
            // Create order from pending data (no order existed before payment)
            $order = OrderController::createOrderFromPendingData($pendingData);

            if ($order) {
                Cache::forget("pending_order_{$externalId}");
                logger("Order {$order->id} created from pending Xendit payment (external_id: {$externalId}).");

                return response()->json(['status' => 'success', 'order_id' => $order->id]);
            }

            logger("Failed to create order from pending data (external_id: {$externalId}).");
        } else {
            // Legacy flow: Order already exists, just update status
            $order = Order::find($externalId);
            if ($order) {
                $order->status = 'PROCESSING';
                $order->save();

                AuditService::updated('order', $order->id, [], ['status' => 'PROCESSING']);

                Notification::create([
                    'id' => Str::uuid(),
                    'customer_id' => $order->customer_id,
                    'title' => 'Payment Successful',
                    'message' => "Payment for Order {$order->id} was successfully completed via Xendit.",
                    'type' => 'success',
                    'is_read' => false,
                ]);

                logger("Order {$externalId} status updated to PROCESSING via Invoice webhook (legacy flow).");
            }
        }
    }

    return response()->json(['status' => 'success']);
});

// Public Auth Routes (rate limited)
Route::middleware('throttle:auth')->prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/register', [RegisterController::class, 'register']);

    // OAuth Routes
    Route::get('/{provider}', [RegisterController::class, 'redirectToProvider'])
        ->where('provider', 'google|facebook');
    Route::get('/{provider}/callback', [RegisterController::class, 'handleProviderCallback'])
        ->where('provider', 'google|facebook');
});

// Forgot Password Routes (limited rate)
Route::prefix('auth')->group(function () {
    Route::post('/forgot-password/send-code', [ForgotPasswordController::class, 'sendCode'])->middleware('throttle:6,1');
    Route::post('/forgot-password/verify', [ForgotPasswordController::class, 'verifyCode'])->middleware('throttle:10,1');
    Route::post('/forgot-password/reset', [ForgotPasswordController::class, 'resetPassword'])->middleware('throttle:5,1');
});

// Protected Auth Routes
Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/password-changed-notification', [PasswordChangeNotificationController::class, 'sendNotification']);
});

// User Profile Routes
Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('user')->group(function () {
    Route::get('/profile', [UserController::class, 'profile']);
});

// Customer Protected Routes
Route::middleware(['auth:sanctum', 'role:customer', 'throttle:api'])->prefix('customer')->group(function () {
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

    // Xendit Payments
    Route::post('/pay-via-ewallet', function (Request $request) {
        try {
            config(['xendivel.auto_id' => false]);
            $payment = Xendivel::payWithEwallet($request)->getResponse();

            return response()->json($payment);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            logger()->error('Xendit E-Wallet Error: '.$msg);

            $decoded = json_decode($msg, true);
            $cleanMessage = $decoded['message'] ?? $msg;
            $cleanMessage = str_ireplace(['exception', 'error:'], '', $cleanMessage);

            return response()->json([
                'message' => $cleanMessage,
            ], 400);
        }
    });

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
    Route::post('/xendit/checkout', [OrderController::class, 'xenditCheckout']);

    // Discounts
    Route::get('/discounts/mine', [DiscountController::class, 'mine']);
    Route::post('/discounts/verify', [DiscountController::class, 'verify']);
});

// Admin Routes
Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('admin')->group(function () {
    // Accounts
    Route::get('/accounts', [AdminAccountController::class, 'index'])->middleware('role:admin');
    Route::get('/accounts/employee/{id}', [AdminAccountController::class, 'showEmployee'])->middleware('role:admin');
    Route::put('/accounts/employee/{id}', [AdminAccountController::class, 'updateEmployee'])->middleware('role:admin');
    Route::get('/accounts/customer/{id}', [AdminAccountController::class, 'showCustomer'])->middleware('role:admin');
    Route::put('/accounts/customer/{id}', [AdminAccountController::class, 'updateCustomer'])->middleware('role:admin');
    Route::delete('/accounts/delete/{id}', [AdminAccountController::class, 'deleteAccount'])->middleware('role:admin');
    Route::post('/accounts/upload-profile-picture', [AdminAccountController::class, 'uploadProfilePicture'])->middleware('role:admin');
    Route::post('/accounts/employee/{id}/assignments', [AdminAccountController::class, 'updateAssignments'])->middleware('role:admin');
    Route::post('/employees/pending-orders', [AdminAccountController::class, 'getPendingOrders'])->middleware('role:admin');
    Route::get('/employees/{id}/live-queue-preview', [AdminAccountController::class, 'previewEmployeeLiveQueue'])->middleware('role:admin');

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

    // Audit Logs
    Route::get('/audit-logs', [AdminAuditLogController::class, 'index'])->middleware('role:admin');
    Route::get('/audit-logs/stats', [AdminAuditLogController::class, 'stats'])->middleware('role:admin');
    Route::post('/audit-logs/bulk-delete', [AdminAuditLogController::class, 'bulkDestroy'])->middleware('role:admin');
    Route::get('/audit-logs/{id}', [AdminAuditLogController::class, 'show'])->middleware('role:admin');
    Route::put('/audit-logs/{id}', [AdminAuditLogController::class, 'update'])->middleware('role:admin');
    Route::delete('/audit-logs/{id}', [AdminAuditLogController::class, 'destroy'])->middleware('role:admin');

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('role:admin,staff,technician,inventory');
    Route::post('/orders/direct', [AdminOrderController::class, 'storeDirect'])->middleware('role:admin');
    Route::patch('/orders/{id}/status', [AdminDashboardController::class, 'updateOrderStatus'])->middleware('role:admin');
    Route::delete('/orders/{id}', [AdminOrderController::class, 'destroy'])->middleware('role:admin');
    // Queue Assignments
    Route::post('/orders/assign-queue', [AdminOrderController::class, 'assignQueue'])->middleware('role:admin');
    Route::get('/orders/queue-assignments', [AdminOrderController::class, 'getQueueAssignments'])->middleware('role:admin');
    Route::delete('/orders/{id}/queue-assignments', [AdminOrderController::class, 'clearOrderQueue'])->middleware('role:admin');
    Route::delete('/orders/{id}/queue-assignments/{employee_id}', [AdminOrderController::class, 'removeEmployeeFromQueue'])->middleware('role:admin');
    Route::get('/orders/user/{userId}', [AdminOrderController::class, 'getOrdersByUser'])->middleware('role:admin');

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

    // Staff view own attendance
    Route::get('/payroll/my-attendance', [AdminPayrollController::class, 'myAttendance'])->middleware('role:admin,staff,technician,inventory');

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
    Route::get('/refunds', [RefundController::class, 'index'])->middleware('role:admin');
    Route::post('/refunds', [RefundController::class, 'store'])->middleware('role:admin');
    Route::get('/refunds/{id}', [RefundController::class, 'show'])->middleware('role:admin');
    Route::patch('/refunds/{id}', [RefundController::class, 'update'])->middleware('role:admin');
    Route::delete('/refunds/{id}', [RefundController::class, 'destroy'])->middleware('role:admin');

    Route::get('/customers/{id}/orders', [RefundController::class, 'customerOrders'])->middleware('role:admin');

    // Admin Notifications CRUD
    Route::get('/notifications', [NotificationController::class, 'adminIndex'])->middleware('role:admin');
    Route::post('/notifications', [NotificationController::class, 'adminStore'])->middleware('role:admin');
    Route::put('/notifications/{id}', [NotificationController::class, 'adminUpdate'])->middleware('role:admin');
    Route::delete('/notifications/{id}', [NotificationController::class, 'adminDestroy'])->middleware('role:admin');

    // Admin Verification Routes
    Route::post('/verification/send-order-delete-code', [AdminVerificationController::class, 'sendOrderDeleteCode'])->middleware('role:admin');
    Route::post('/verification/send-account-delete-code', [AdminVerificationController::class, 'sendAccountDeleteCode'])->middleware('role:admin');
    Route::post('/verification/verify-code', [AdminVerificationController::class, 'verifyCode'])->middleware('role:admin');
});

// Messaging & Notifications
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/staff/live-queue', [StaffLiveQueueController::class, 'index']);
    Route::post('/staff/orders/{id}/task-status', [StaffLiveQueueController::class, 'updateTaskStatus']);

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
Route::middleware(['auth:sanctum', 'role:admin', 'throttle:api'])->get('/admin/test', function () {
    return response()->json(['message' => 'Admin access granted']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::delete('/accounts/{id}/soft-delete', [AdminAccountController::class, 'softDestroy']);
    Route::delete('/accounts/deleted/{id}/purge', [AdminAccountController::class, 'purgeDeleted']);
    Route::get('/accounts/deleted', [AdminAccountController::class, 'deletedAccounts']);
});

// Cart Routes
Route::middleware(['auth:sanctum', 'role:customer', 'throttle:api'])->prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/', [CartController::class, 'store']);
    Route::post('/buy-now', [CartController::class, 'buyNow']);
    Route::patch('/{id}', [CartController::class, 'update']);
    Route::delete('/{id}', [CartController::class, 'destroy']);
});

// Settings Utility Routes (sensitive operations)
Route::middleware(['auth:sanctum', 'role:customer', 'throttle:sensitive'])->prefix('settings')->group(function () {
    Route::post('/profile-picture', [CustomerController::class, 'updateProfilePicture']);
    Route::patch('/password', [CustomerController::class, 'updatePassword']);
    Route::post('/change-password/send-code', [ForgotPasswordController::class, 'sendChangePasswordCode']);
    Route::post('/change-password/verify', [ForgotPasswordController::class, 'verifyChangePasswordCode']);
    Route::post('/change-password/confirm', [ForgotPasswordController::class, 'confirmChangePassword']);
});

Route::middleware(['throttle:api'])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:search');
    Route::get('/products/search', [ProductController::class, 'search'])->middleware(['auth:sanctum', 'throttle:search']);
    Route::get('/products/sold-counts', [ProductController::class, 'soldCounts']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/colors', [ColorController::class, 'index']);
});

// Test route - send a test email via Resend
Route::post('/test/send-email', function (Request $request) {
    $validated = $request->validate([
        'to' => 'required|email',
        'subject' => 'required|string|max:255',
        'html' => 'required|string',
    ]);

    try {
        $resend = Resend::client(env('RESEND_API_KEY'));
        $resend->emails->send([
            'from' => env('MAIL_FROM_ADDRESS', 'Acme <onboarding@resend.dev>'),
            'to' => [$validated['to']],
            'subject' => $validated['subject'],
            'html' => $validated['html'],
        ]);

        return response()->json(['status' => 'success', 'message' => 'Email sent']);
    } catch (Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
});

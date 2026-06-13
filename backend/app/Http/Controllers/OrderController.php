<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemColor;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\AuditService;
use GlennRaya\Xendivel\XenditApi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orders = Order::with([
            'items',
            'items.product',
            'items.variant',
            'items.colors.colorDetails',
            'items.screenplate',
            'address',
        ])
            ->where('customer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $orders->map(function ($order) {
            return [
                'order_id' => $order->id,
                'user_id' => $order->customer_id,
                'total_amount' => (float) $order->total_amount,
                'status' => $order->status,
                'created_at' => $order->created_at,
                'admin_comment' => $order->admin_comment,
                'feedback' => $order->feedback,
                'complaint' => $order->complaint,
                'rating' => $order->rating,
                'shipping_address' => $order->address ? [
                    'label' => $order->address->adress_label,
                    'region' => $order->address->region,
                    'province' => $order->address->province,
                    'city' => $order->address->city,
                    'barangay' => $order->address->barangay,
                    'street' => $order->address->street,
                    'postal_code' => $order->address->postal_code,
                    'contact_number' => $order->address->contact_number,
                ] : null,
                'order_items' => $order->items->map(function ($item) use ($order) {
                    $order_item_colors = $item->colors ? $item->colors->map(function ($c) {
                        return [
                            'id' => $c->color_id,
                            'name' => $c->colorDetails ? $c->colorDetails->name : $c->color_id,
                            'hex' => $c->colorDetails ? $c->colorDetails->hex : '#000000',
                        ];
                    })->toArray() : [];

                    $plate = $item->screenplate ? [
                        'id' => $item->screenplate_id,
                        'name' => $item->screenplate->plate_name ?? 'Custom Plate',
                        'type' => $item->screenplate->type ?? 'Flatscreen',
                        'channels' => (int) $item->screenplate->channels ?? 1,
                        'setupFee' => 0,
                        'printPricePerUnit' => (float) $item->plate_price,
                    ] : null;

                    return [
                        'id' => (string) $item->id,
                        'product_id' => $item->product_id,
                        'productName' => $item->product ? $item->product->name : 'Unknown Product',
                        'short_description' => $item->product ? $item->product->short_description : null,
                        'productImage' => $item->product && $item->product->main_image
                            ? '/images/products/'.$item->product->main_image
                            : '',
                        'quantity' => $item->quantity,
                        'variant' => [
                            'id' => $item->variant_id,
                            'size' => $item->variant ? $item->variant->size : '',
                            'width' => $item->variant ? $item->variant->width : null,
                            'height' => $item->variant ? $item->variant->height : null,
                            'unitPrice' => (float) $item->unit_price,
                        ],
                        'order_item_colors' => $order_item_colors,
                        'plate' => $plate,
                        'customRequirements' => $order->production_notes,
                    ];
                })->toArray(),
            ];
        });

        return response()->json($formatted);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $order = Order::with([
            'items',
            'items.product',
            'items.variant',
            'items.colors.colorDetails',
            'items.screenplate',
            'address',
        ])
            ->where('id', $id)
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Security: customer can only see their own, admin can see all
        if ($user instanceof Customer && $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $formatted = [
            'order_id' => $order->id,
            'user_id' => $order->customer_id,
            'total_amount' => (float) $order->total_amount,
            'status' => $order->status,
            'created_at' => $order->created_at,
            'admin_comment' => $order->admin_comment,
            'feedback' => $order->feedback,
            'complaint' => $order->complaint,
            'rating' => $order->rating,
            'shipping_address' => $order->address ? [
                'label' => $order->address->adress_label,
                'region' => $order->address->region,
                'province' => $order->address->province,
                'city' => $order->address->city,
                'barangay' => $order->address->barangay,
                'street' => $order->address->street,
                'postal_code' => $order->address->postal_code,
                'contact_number' => $order->address->contact_number,
            ] : null,
            'order_items' => $order->items->map(function ($item) {
                $order_item_colors = $item->colors ? $item->colors->map(function ($c) {
                    return [
                        'id' => $c->color_id,
                        'name' => $c->colorDetails ? $c->colorDetails->name : $c->color_id,
                        'hex' => $c->colorDetails ? $c->colorDetails->hex : '#000000',
                    ];
                })->toArray() : [];

                $plate = $item->screenplate ? [
                    'id' => $item->screenplate_id,
                    'name' => $item->screenplate->plate_name ?? 'Custom Plate',
                    'type' => $item->screenplate->type ?? 'Flatscreen',
                    'channels' => (int) $item->screenplate->channels ?? 1,
                    'setupFee' => 0,
                    'printPricePerUnit' => (float) $item->plate_price,
                ] : null;

                return [
                    'id' => (string) $item->id,
                    'product_id' => $item->product_id,
                    'productName' => $item->product ? $item->product->name : 'Unknown Product',
                    'short_description' => $item->product ? $item->product->short_description : null,
                    'productImage' => $item->product && $item->product->main_image
                        ? '/images/products/'.$item->product->main_image
                        : '',
                    'quantity' => $item->quantity,
                    'variant' => [
                        'id' => $item->variant_id,
                        'size' => $item->variant ? $item->variant->size : '',
                        'width' => $item->variant ? $item->variant->width : null,
                        'height' => $item->variant ? $item->variant->height : null,
                        'unitPrice' => (float) $item->unit_price,
                    ],
                    'order_item_colors' => $order_item_colors,
                    'plate' => $plate,
                ];
            })->toArray(),
        ];

        return response()->json($formatted);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::with('items')->where('customer_id', $user->id)->where('id', $id)->first();
        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($request->has('status')) {
            $order->status = $request->status;
        }
        if ($request->has('admin_comment')) {
            $order->admin_comment = $request->admin_comment;
        }

        $validated = $request->validate([
            'rating' => 'nullable|integer|min:0|max:5',
            'feedback' => 'nullable|string|max:1000',
            'complaint' => 'nullable|string|max:1000',
        ]);

        if ($request->has('rating')) {
            $order->rating = $validated['rating'];
        }
        if ($request->has('feedback')) {
            $order->feedback = $validated['feedback'];
        }
        if ($request->has('complaint')) {
            $order->complaint = $validated['complaint'];
        }

        $order->save();

        AuditService::updated('order', $order->id, [], [
            'status' => $order->status,
            'rating' => $order->rating,
            'feedback' => $order->feedback,
        ]);

        // Sync product reviews if order is reviewed
        if ($request->hasAny(['rating', 'feedback']) && $order->status === 'DELIVERED') {
            foreach ($order->items as $item) {
                ProductReview::updateOrCreate(
                    [
                        'order_id' => $order->id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'customer_id' => $user->id,
                        'rating' => $order->rating,
                        'feedback' => $order->feedback,
                    ]
                );

                // Recalculate product ratings
                $avgRating = ProductReview::where('product_id', $item->product_id)->avg('rating');
                Product::where('id', $item->product_id)->update(['ratings' => round($avgRating)]);
            }
        }

        return response()->json(['message' => 'Order updated']);
    }

    /**
     * Store a newly created order in storage.
     */
    public function xenditCheckout(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $validated = $request->validate([
                'cart_item_ids' => 'required|array|min:1',
                'cart_item_ids.*' => 'required|string',
                'address_id' => 'required|string',
                'delivery_method_id' => 'required|string|exists:delivery_methods,id',
                'production_notes' => 'nullable|string',
                'discount_id' => 'nullable|string|exists:discounts,id',
                'payment_method' => 'nullable|string|in:gcash,bdo,paymaya',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        }

        // Load cart items with relations
        $cartItems = CartItem::with(['colors', 'variant', 'screenplate', 'product'])
            ->whereIn('id', $validated['cart_item_ids'])
            ->get();

        // Validate ownership
        foreach ($cartItems as $cartItem) {
            if ($cartItem->customer_id !== $user->id) {
                return response()->json(['message' => 'Forbidden access to cart item.'], 403);
            }
        }

        if ($cartItems->count() !== count($validated['cart_item_ids'])) {
            return response()->json(['message' => 'Some cart items were not found or do not belong to you.'], 400);
        }

        // Stock validation
        $stockErrors = [];
        foreach ($cartItems as $cartItem) {
            if ($cartItem->variant && $cartItem->quantity > $cartItem->variant->stock) {
                $stockErrors[] = [
                    'cart_item_id' => $cartItem->id,
                    'product_name' => $cartItem->product?->name ?? 'Unknown Product',
                    'variant_id' => $cartItem->variant_id,
                    'requested' => $cartItem->quantity,
                    'available' => $cartItem->variant->stock,
                ];
            }
        }

        if (! empty($stockErrors)) {
            return response()->json([
                'message' => 'INSUFFICIENT_STOCK',
                'stock_errors' => $stockErrors,
            ], 422);
        }

        // Calculate totals
        $totalAmount = $cartItems->sum('total_cart_price');
        $discountId = $validated['discount_id'] ?? null;
        $totalDiscountAmount = 0;

        if ($discountId) {
            $discount = Discount::find($discountId);
            if ($discount && ! $discount->already_used) {
                $isValid = true;
                if ($discount->customer_id && $discount->customer_id !== $user->id) {
                    $isValid = false;
                }
                if ($discount->expires_at && $discount->expires_at->isPast()) {
                    $isValid = false;
                }
                if ($totalAmount < $discount->min_spend) {
                    $isValid = false;
                }

                if ($isValid) {
                    if ($discount->variant_id) {
                        $relevantItems = $cartItems->where('variant_id', $discount->variant_id);
                        if ($relevantItems->count() > 0) {
                            $relevantSubtotal = $relevantItems->sum('total_cart_price');
                            $totalDiscountAmount = $discount->type === 'fixed'
                                ? min($discount->value, $relevantSubtotal)
                                : $relevantSubtotal * ($discount->value / 100);
                        }
                    } elseif ($discount->product_id) {
                        $relevantItems = $cartItems->where('product_id', $discount->product_id);
                        if ($relevantItems->count() > 0) {
                            $relevantSubtotal = $relevantItems->sum('total_cart_price');
                            $totalDiscountAmount = $discount->type === 'fixed'
                                ? min($discount->value, $relevantSubtotal)
                                : $relevantSubtotal * ($discount->value / 100);
                        }
                    } else {
                        $totalDiscountAmount = $discount->type === 'fixed'
                            ? min($discount->value, $totalAmount)
                            : $totalAmount * ($discount->value / 100);
                    }
                }
            }
        }

        $finalAmount = max(0, $totalAmount - $totalDiscountAmount);

        // Generate external_id for Xendit
        $externalId = 'XENDIT_'.strtoupper(Str::random(20));

        // Store pending order data in cache (24h TTL)
        $pendingData = [
            'customer_id' => $user->id,
            'cart_item_ids' => $validated['cart_item_ids'],
            'address_id' => $validated['address_id'],
            'delivery_method_id' => $validated['delivery_method_id'],
            'production_notes' => $validated['production_notes'] ?? null,
            'discount_id' => $discountId,
            'total_amount' => $finalAmount,
            'total_discount_amount' => $totalDiscountAmount,
            'discount_marked_used' => $discountId && isset($discount) && $discount && ! $discount->already_used,
        ];

        Cache::put("pending_order_{$externalId}", $pendingData, now()->addHours(24));

        // Create Xendit invoice — filter payment methods based on selection
        try {
            $origin = $request->header('Origin') ?: config('app.url');
            $invoicePayload = [
                'external_id' => $externalId,
                'amount' => (int) $finalAmount,
                'description' => 'Payment for PIXS Order',
                'currency' => 'PHP',
                'success_redirect_url' => $origin.'/payment/success?external_id='.$externalId,
                'failure_redirect_url' => $origin.'/transactions?payment=failed',
            ];

            $paymentMethod = $validated['payment_method'] ?? null;
            if ($paymentMethod === 'gcash') {
                $invoicePayload['payment_methods'] = ['GCASH'];
            } elseif ($paymentMethod === 'paymaya') {
                $invoicePayload['payment_methods'] = ['PAYMAYA'];
            }
            // bdo or any other: omit payment_methods so Xendit shows all enabled methods

            if ($user) {
                $invoicePayload['customer'] = [
                    'given_names' => $user->first_name,
                    'surname' => $user->last_name,
                    'email' => $user->email,
                ];
            }

            $xenditRes = XenditApi::api('post', 'v2/invoices', $invoicePayload);

            if ($xenditRes->failed()) {
                Cache::forget("pending_order_{$externalId}");
                throw new \Exception($xenditRes->body());
            }

            $decodedRes = json_decode($xenditRes->body());
            $checkoutUrl = $decodedRes->invoice_url ?? null;

            if (! $checkoutUrl) {
                Cache::forget("pending_order_{$externalId}");

                return response()->json(['message' => 'Failed to retrieve checkout URL from Xendit.'], 500);
            }

            return response()->json([
                'checkout_url' => $checkoutUrl,
                'external_id' => $externalId,
            ]);
        } catch (\Exception $xenditEx) {
            Cache::forget("pending_order_{$externalId}");
            $rawMsg = $xenditEx->getMessage();
            $decoded = json_decode($rawMsg, true);
            $cleanMsg = $decoded['message'] ?? $rawMsg;
            $cleanMsg = str_ireplace(['exception', 'error:'], '', $cleanMsg);

            return response()->json(['message' => 'Xendit checkout failed: '.$cleanMsg], 400);
        }
    }

    /**
     * Verify Xendit payment from the frontend redirect (useful for local dev without webhooks).
     */
    public function verifyXenditPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'external_id' => 'required|string',
        ]);

        $externalId = $validated['external_id'];

        // If order already exists, it means webhook beat us to it, which is fine
        if (Order::where('id', $externalId)->exists() || Order::whereRaw("JSON_UNQUOTE(JSON_EXTRACT(id, '$')) = ?", [$externalId])->exists()) {
            return response()->json(['status' => 'success', 'message' => 'Order already created.']);
        }

        try {
            $xenditRes = XenditApi::api('get', 'v2/invoices', ['external_id' => $externalId]);

            $invoices = json_decode($xenditRes->body());

            if (empty($invoices)) {
                return response()->json(['status' => 'failed', 'message' => 'Invoice not found'], 404);
            }

            $invoice = $invoices[0];
            $status = $invoice->status;

            if ($status === 'PAID' || $status === 'SETTLED') {
                $pendingData = Cache::get("pending_order_{$externalId}");

                if ($pendingData) {
                    $order = self::createOrderFromPendingData($pendingData);

                    if ($order) {
                        Cache::forget("pending_order_{$externalId}");
                        logger("Order {$order->id} created via manual verify (external_id: {$externalId}).");

                        return response()->json(['status' => 'success', 'order_id' => $order->id]);
                    }

                    return response()->json(['status' => 'failed', 'message' => 'Failed to create order from pending data.'], 500);
                }

                // Maybe it was already processed
                return response()->json(['status' => 'success', 'message' => 'Payment verified but no pending data found (maybe already processed).']);
            }

            return response()->json(['status' => 'pending', 'message' => 'Payment not yet completed.']);
        } catch (\Throwable $e) {
            Log::error("verifyXenditPayment failed for external_id: {$externalId}: ".$e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create an order from pending checkout data (called by Xendit webhook on successful payment).
     */
    public static function createOrderFromPendingData(array $pendingData): ?Order
    {
        $customerId = $pendingData['customer_id'] ?? null;
        $cartItemIds = $pendingData['cart_item_ids'] ?? [];

        $customer = Customer::find($customerId);
        if (! $customer) {
            Log::error('createOrderFromPendingData: Customer not found', ['customer_id' => $customerId]);

            return null;
        }

        try {
            return DB::transaction(function () use ($pendingData, $cartItemIds, $customer, $customerId) {
                // Reload cart items
                $cartItems = CartItem::with(['colors', 'variant', 'screenplate', 'product'])
                    ->whereIn('id', $cartItemIds)
                    ->get();

                if ($cartItems->isEmpty()) {
                    Log::warning('createOrderFromPendingData: No cart items found', ['cart_item_ids' => $cartItemIds]);

                    return null;
                }

                // Mark discount as used if applicable
                $discountId = $pendingData['discount_id'] ?? null;
                if ($discountId && ($pendingData['discount_marked_used'] ?? false)) {
                    $discount = Discount::find($discountId);
                    if ($discount && ! $discount->already_used) {
                        $discount->already_used = true;
                        $discount->save();
                    }
                }

                $finalAmount = $pendingData['total_amount'];
                $totalDiscountAmount = $pendingData['total_discount_amount'];

                // Generate order ID
                $orderId = 'ORD-'.strtoupper(Str::random(10));

                // Create the order
                $order = Order::create([
                    'id' => $orderId,
                    'customer_id' => $customerId,
                    'address_id' => $pendingData['address_id'],
                    'payment_code_id' => null,
                    'delivery_method_id' => $pendingData['delivery_method_id'],
                    'production_notes' => $pendingData['production_notes'] ?? null,
                    'discount_id' => $discountId,
                    'total_discount_amount' => $totalDiscountAmount,
                    'total_amount' => $finalAmount,
                    'status' => 'PENDING',
                    'rating' => 0,
                    'feedback' => null,
                    'admin_comment' => null,
                    'complaint' => null,
                ]);

                // Update customer lifetime value
                $customer->increment('orders');
                $customer->increment('total_orders_value', $finalAmount);

                // Create order items
                foreach ($cartItems as $cartItem) {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'customer_id' => $cartItem->customer_id,
                        'product_id' => $cartItem->product_id,
                        'variant_id' => $cartItem->variant_id,
                        'screenplate_id' => $cartItem->screenplate_id,
                        'quantity' => $cartItem->quantity,
                        'unit_price' => $cartItem->unit_price,
                        'plate_price' => $cartItem->plate_price,
                    ]);

                    // Deduct stock
                    if ($cartItem->variant_id) {
                        DB::statement('
                            UPDATE product_variants
                            SET stock = GREATEST(0, CAST(stock AS SIGNED) - ?)
                            WHERE variant_id = ?
                        ', [$cartItem->quantity, $cartItem->variant_id]);
                    }

                    // Update product sold count and stock status
                    if ($cartItem->product_id) {
                        DB::statement('
                            UPDATE products
                            SET
                                total_sold = total_sold + ?,
                                is_in_stock = (
                                    SELECT EXISTS(
                                        SELECT 1 FROM product_variants
                                        WHERE product_id = products.id
                                        AND stock >= products.min_order
                                    )
                                )
                            WHERE id = ?
                        ', [$cartItem->quantity, $cartItem->product_id]);
                    }

                    // Create order item colors
                    if ($cartItem->colors) {
                        foreach ($cartItem->colors as $cartItemColor) {
                            OrderItemColor::create([
                                'order_item_id' => $orderItem->id,
                                'color_id' => $cartItemColor->color_id,
                                'channel_label' => $cartItemColor->channel_label,
                                'channel_order' => $cartItemColor->channel_order,
                            ]);
                        }
                    }
                }

                // Cleanup cart items
                CartItem::whereIn('id', $cartItemIds)->where('temp', true)->delete();
                CartItem::whereIn('id', $cartItemIds)->where('temp', false)->update(['selected' => 0]);

                // Send success notification to customer
                Notification::create([
                    'id' => Str::uuid(),
                    'customer_id' => $customerId,
                    'title' => 'Payment Successful',
                    'message' => "Order {$orderId} has been successfully placed and payment confirmed.",
                    'type' => 'success',
                    'is_read' => false,
                ]);

                // Notify admin via chat
                $adminId = '1';
                $convId = $adminId.'_'.$customerId;
                DB::table('conversations')->insertOrIgnore([
                    'id' => $convId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('messages')->insert([
                    'id' => 'msg_'.Str::random(10),
                    'conversation_id' => $convId,
                    'sender_id' => $customerId,
                    'sender_type' => 'customer',
                    'receiver_id' => $adminId,
                    'receiver_type' => 'employee',
                    'message' => 'review your shipping address',
                    'message_type' => 'order',
                    'type_id' => $orderId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                AuditService::created('order', $orderId, [
                    'total_amount' => $finalAmount,
                    'status' => 'PENDING',
                    'item_count' => $cartItems->count(),
                ]);

                Log::info("Order {$orderId} created from pending Xendit payment.");

                return $order;
            });
        } catch (\Throwable $e) {
            Log::error('createOrderFromPendingData failed', [
                'error' => $e->getMessage(),
                'customer_id' => $customerId,
            ]);

            return null;
        }
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('Order creation attempt', ['request' => $request->all()]);

        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $validated = $request->validate([
                'cart_item_ids' => 'required|array|min:1',
                'cart_item_ids.*' => 'required|string',
                'address_id' => 'required|string',
                'payment_type' => 'nullable|string|in:gcash,bdo,paymaya,payment_code',
                'payment_code' => 'nullable|string',
                'delivery_method_id' => 'required|string|exists:delivery_methods,id',
                'production_notes' => 'nullable|string',
                'discount_id' => 'nullable|string|exists:discounts,id',
            ]);
        } catch (ValidationException $e) {
            Log::warning('Order validation failed', ['errors' => $e->errors()]);

            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        }

        if (empty($validated['payment_code']) && empty($validated['payment_type'])) {
            return response()->json(['message' => 'Either a payment method or a payment code is required.'], 422);
        }

        // Verify payment code if provided
        $payCode = null;
        if (! empty($validated['payment_code'])) {
            $payCode = DB::table('payment_codes')
                ->where('code', $validated['payment_code'])
                ->first();

            if (! $payCode) {
                return response()->json(['message' => 'The payment code is invalid.'], 404);
            }

            if ($payCode->is_used) {
                return response()->json([
                    'message' => 'This payment code has already been used.',
                    'error_code' => 'PAYMENT_CODE_ALREADY_USED',
                ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($validated, $user, $payCode) {
                // STEP 2: Load cart items with relations
                $cartItems = CartItem::with(['colors', 'variant', 'screenplate', 'product'])
                    ->whereIn('id', $validated['cart_item_ids'])
                    ->get();

                // STEP 1 Validation: Ensure ALL cart_items belong to authenticated customer
                foreach ($cartItems as $cartItem) {
                    if ($cartItem->customer_id !== $user->id) {
                        return response()->json(['message' => 'Forbidden access to cart item.'], 403);
                    }
                }

                if ($cartItems->count() !== count($validated['cart_item_ids'])) {
                    return response()->json(['message' => 'Some cart items were not found or do not belong to you.'], 400);
                }

                // STEP 1.5: Stock validation — check each selected cart item against variant stock
                $stockErrors = [];
                foreach ($cartItems as $cartItem) {
                    if ($cartItem->variant && $cartItem->quantity > $cartItem->variant->stock) {
                        $stockErrors[] = [
                            'cart_item_id' => $cartItem->id,
                            'product_name' => $cartItem->product?->name ?? 'Unknown Product',
                            'variant_id' => $cartItem->variant_id,
                            'requested' => $cartItem->quantity,
                            'available' => $cartItem->variant->stock,
                        ];
                    }
                }

                if (! empty($stockErrors)) {
                    return response()->json([
                        'message' => 'INSUFFICIENT_STOCK',
                        'stock_errors' => $stockErrors,
                    ], 422);
                }

                // STEP 2.5: Mark payment code as used if verified
                if ($payCode) {
                    DB::table('payment_codes')
                        ->where('id', $payCode->id)
                        ->update([
                            'is_used' => 1,
                            'used_at' => now(),
                        ]);
                }

                // STEP 3: Calculate totals
                $totalAmount = $cartItems->sum('total_cart_price');
                $discountId = $validated['discount_id'] ?? null;
                $totalDiscountAmount = 0;

                if ($discountId) {
                    $discount = Discount::find($discountId);
                    if ($discount && ! $discount->already_used) {
                        // Basic validation
                        $isValid = true;
                        if ($discount->customer_id && $discount->customer_id !== $user->id) {
                            $isValid = false;
                        }
                        if ($discount->expires_at && $discount->expires_at->isPast()) {
                            $isValid = false;
                        }
                        if ($totalAmount < $discount->min_spend) {
                            $isValid = false;
                        }

                        if ($isValid) {
                            if ($discount->variant_id) {
                                $relevantItems = $cartItems->where('variant_id', $discount->variant_id);
                                if ($relevantItems->count() > 0) {
                                    $relevantSubtotal = $relevantItems->sum('total_cart_price');
                                    $totalDiscountAmount = $discount->type === 'fixed'
                                        ? min($discount->value, $relevantSubtotal)
                                        : $relevantSubtotal * ($discount->value / 100);
                                }
                            } elseif ($discount->product_id) {
                                $relevantItems = $cartItems->where('product_id', $discount->product_id);
                                if ($relevantItems->count() > 0) {
                                    $relevantSubtotal = $relevantItems->sum('total_cart_price');
                                    $totalDiscountAmount = $discount->type === 'fixed'
                                        ? min($discount->value, $relevantSubtotal)
                                        : $relevantSubtotal * ($discount->value / 100);
                                }
                            } else {
                                $totalDiscountAmount = $discount->type === 'fixed'
                                    ? min($discount->value, $totalAmount)
                                    : $totalAmount * ($discount->value / 100);
                            }

                            if ($totalDiscountAmount > 0) {
                                $discount->already_used = true;
                                $discount->save();
                            }
                        }
                    }
                }

                $finalAmount = max(0, $totalAmount - $totalDiscountAmount);

                // STEP 4: Generate order ID
                $orderId = 'ORD-'.strtoupper(Str::random(10));

                // STEP 5: Create the order row
                $order = Order::create([
                    'id' => $orderId,
                    'customer_id' => $user->id,
                    'address_id' => $validated['address_id'],
                    'payment_code_id' => $payCode ? $payCode->id : null,
                    'delivery_method_id' => $validated['delivery_method_id'],
                    'production_notes' => $validated['production_notes'] ?? null,
                    'discount_id' => $discountId,
                    'total_discount_amount' => $totalDiscountAmount,
                    'total_amount' => $finalAmount,
                    'status' => $payCode ? 'UNPAID' : 'PENDING',
                    'rating' => 0,
                    'feedback' => null,
                    'admin_comment' => null,
                    'complaint' => null,
                ]);

                // Update Customer Lifetime Value and Order Count
                $user->increment('orders');
                $user->increment('total_orders_value', $finalAmount);

                // STEP 6: For each cart_item, create order_item row
                foreach ($cartItems as $cartItem) {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'customer_id' => $cartItem->customer_id,
                        'product_id' => $cartItem->product_id,
                        'variant_id' => $cartItem->variant_id,
                        'screenplate_id' => $cartItem->screenplate_id,
                        'quantity' => $cartItem->quantity,
                        'unit_price' => $cartItem->unit_price,
                        'plate_price' => $cartItem->plate_price,
                    ]);

                    // Deduct variant stock first, then re-evaluate is_in_stock
                    if ($cartItem->variant_id) {
                        DB::statement('
                            UPDATE product_variants 
                            SET stock = GREATEST(0, CAST(stock AS SIGNED) - ?)
                            WHERE variant_id = ?
                        ', [
                            $cartItem->quantity,
                            $cartItem->variant_id,
                        ]);
                    }

                    // Increment total_sold & set is_in_stock = 0 if no variant has stock >= min_order
                    if ($cartItem->product_id) {
                        DB::statement('
                            UPDATE products 
                            SET 
                                total_sold = total_sold + ?,
                                is_in_stock = (
                                    SELECT EXISTS(
                                        SELECT 1 FROM product_variants 
                                        WHERE product_id = products.id 
                                        AND stock >= products.min_order
                                    )
                                )
                            WHERE id = ?
                        ', [
                            $cartItem->quantity,
                            $cartItem->product_id,
                        ]);
                    }

                    // STEP 7: For each cart_item_color of that cart_item, create order_item_color row
                    if ($cartItem->colors) {
                        foreach ($cartItem->colors as $cartItemColor) {
                            OrderItemColor::create([
                                'order_item_id' => $orderItem->id,
                                'color_id' => $cartItemColor->color_id,
                                'channel_label' => $cartItemColor->channel_label,
                                'channel_order' => $cartItemColor->channel_order,
                            ]);
                        }
                    }
                }

                // STEP 8: Cleanup cart_items
                // Delete temporary items, just unselect regular items
                CartItem::whereIn('id', $validated['cart_item_ids'])
                    ->where('temp', true)
                    ->delete();

                CartItem::whereIn('id', $validated['cart_item_ids'])
                    ->where('temp', false)
                    ->update(['selected' => 0]);

                // STEP 9: Send Success Notification
                Notification::create([
                    'id' => Str::uuid(),
                    'customer_id' => $user->id,
                    'title' => 'Purchase Successful',
                    'message' => "Order {$orderId} has been successfully placed.",
                    'type' => 'success',
                    'is_read' => false,
                ]);

                // STEP 9.5: Automatically notify Admin via Chat
                $adminId = '1'; // Default admin
                $convId = $adminId.'_'.$user->id;
                DB::table('conversations')->insertOrIgnore([
                    'id' => $convId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('messages')->insert([
                    'id' => 'msg_'.Str::random(10),
                    'conversation_id' => $convId,
                    'sender_id' => $user->id,
                    'sender_type' => 'customer',
                    'receiver_id' => $adminId,
                    'receiver_type' => 'employee',
                    'message' => 'review your shipping address',
                    'message_type' => 'order',
                    'type_id' => $orderId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // STEP 9.6: If payment method is an e-wallet, initiate a payment link via Xendit Invoices
                $paymentType = $validated['payment_type'] ?? null;
                $checkoutUrl = null;

                if (in_array($paymentType, ['gcash', 'bdo', 'paymaya'])) {
                    $xenditPaymentMethods = match ($paymentType) {
                        'gcash' => ['GCASH'],
                        'bdo' => ['BDO'],
                        'paymaya' => ['PAYMAYA'],
                    };

                    try {
                        $origin = request()->header('Origin') ?: config('app.url');
                        $invoicePayload = [
                            'external_id' => $orderId,
                            'amount' => (int) $finalAmount,
                            'description' => 'Payment for Order '.$orderId,
                            'currency' => 'PHP',
                            'success_redirect_url' => $origin.'/homepage?payment=success&orderId='.$orderId,
                            'failure_redirect_url' => $origin.'/homepage?payment=failed&orderId='.$orderId,
                            'payment_methods' => $xenditPaymentMethods,
                        ];

                        if ($user) {
                            $invoicePayload['customer'] = [
                                'given_names' => $user->first_name,
                                'surname' => $user->last_name,
                                'email' => $user->email,
                            ];
                        }

                        $xenditRes = XenditApi::api('post', 'v2/invoices', $invoicePayload);

                        if ($xenditRes->failed()) {
                            throw new \Exception($xenditRes->body());
                        }

                        $decodedRes = json_decode($xenditRes->body());
                        $checkoutUrl = $decodedRes->invoice_url ?? null;

                        // Set status to PENDING — user is actively paying on Xendit portal
                        // Webhook will update to PROCESSING once payment is confirmed by Xendit
                        $order->status = 'PENDING';
                        $order->save();
                    } catch (\Exception $xenditEx) {
                        // Throwing exception rolls back DB transaction completely
                        throw new \Exception('Xendit Payment Failed: '.$xenditEx->getMessage());
                    }
                }

                // STEP 10: Return JSON response (201)
                AuditService::created('order', $orderId, [
                    'total_amount' => $finalAmount,
                    'status' => $order->status,
                    'item_count' => $cartItems->count(),
                ]);

                return response()->json([
                    'id' => $orderId,
                    'total_amount' => $finalAmount,
                    'status' => $order->status,
                    'checkout_url' => $checkoutUrl,
                ], 201);
            });
        } catch (\Throwable $e) {
            Log::error('OrderController@store failed', ['message' => $e->getMessage()]);

            $errMsg = $e->getMessage();
            $statusCode = 500;
            if (str_contains($errMsg, 'Xendit Payment Failed:')) {
                $statusCode = 400;
                $rawXenditMsg = str_replace('Xendit Payment Failed: ', '', $errMsg);
                $decoded = json_decode($rawXenditMsg, true);
                $cleanMsg = $decoded['message'] ?? $rawXenditMsg;
                $cleanMsg = str_ireplace(['exception', 'error:'], '', $cleanMsg);
                $errMsg = $cleanMsg;
            } else {
                try {
                    Notification::create([
                        'id' => Str::uuid(),
                        'customer_id' => $user->id,
                        'title' => 'Purchase Failed',
                        'message' => 'An error occurred while processing your order.',
                        'type' => 'error',
                        'is_read' => false,
                    ]);
                } catch (\Exception $ex) {
                    Log::error('Failed to save error notification: '.$ex->getMessage());
                }
            }

            return response()->json(['message' => $errMsg], $statusCode);
        }
    }
}

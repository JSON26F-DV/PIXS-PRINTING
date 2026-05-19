<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemColor;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                'payment_method_id' => 'required|string',
                'delivery_method_id' => 'required|string|exists:delivery_methods,id',
                'production_notes' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            Log::warning('Order validation failed', ['errors' => $e->errors()]);

            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($validated, $user) {
                // STEP 2: Load cart items with relations
                $cartItems = CartItem::with(['colors', 'variant', 'screenplate'])
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

                // STEP 3: Calculate totals
                $totalAmount = $cartItems->sum('total_cart_price');

                // STEP 4: Generate order ID
                $orderId = 'ORD-'.strtoupper(Str::random(10));

                // STEP 5: Create the order row
                $order = Order::create([
                    'id' => $orderId,
                    'customer_id' => $user->id,
                    'address_id' => $validated['address_id'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'delivery_method_id' => $validated['delivery_method_id'],
                    'production_notes' => $validated['production_notes'] ?? null,
                    'total_amount' => $totalAmount,
                    'status' => 'PENDING',
                    'rating' => 0,
                    'feedback' => null,
                    'admin_comment' => null,
                    'complaint' => null,
                ]);

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

                    // total_sold Increment & is_in_stock Evaluator
                    if ($cartItem->product_id) {
                        DB::statement('
                            UPDATE products 
                            SET 
                                total_sold = total_sold + ?,
                                is_in_stock = IF((SELECT SUM(stock) FROM product_variants WHERE product_id = products.id) > 0, 1, 0)
                            WHERE id = ?
                        ', [
                            $cartItem->quantity,
                            $cartItem->product_id,
                        ]);
                    }
                    // Accurate Stock Deductions strictly rely upon dynamically targeted variants now natively
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

                // STEP 10: Return JSON response (201)
                return response()->json([
                    'id' => $orderId,
                    'total_amount' => $totalAmount,
                    'status' => 'PENDING',
                ], 201);
            });
        } catch (\Throwable $e) {
            Log::error('OrderController@store failed', ['message' => $e->getMessage()]);

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

            return response()->json(['message' => 'Failed to create order: '.$e->getMessage()], 500);
        }
    }
}

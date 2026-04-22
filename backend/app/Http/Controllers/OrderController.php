<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemColor;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'cart_item_ids' => 'required|array|min:1',
            'cart_item_ids.*' => 'required|string',
            'address_id' => 'required|string',
            'payment_method_id' => 'required|string',
            'delivery_method_id' => 'required|string|exists:delivery_methods,id',
            'production_notes' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $user) {
                // STEP 2: Load cart items with relations
                $cartItems = \App\Models\CartItem::with(['colors.color', 'variant', 'screenplate', 'product.category'])
                    ->whereIn('id', $validated['cart_item_ids'])
                    ->get();

                // STEP 1 Validation: Ensure ALL cart_items belong to authenticated customer
                foreach ($cartItems as $cartItem) {
                    if ($cartItem->customer_id !== $user->id) {
                        return response()->json(['message' => 'Forbidden access to cart item.'], 403);
                    }
                }

                if ($cartItems->count() !== count($validated['cart_item_ids'])) {
                     return response()->json(['message' => 'Some cart items were not found.'], 400);
                }

                // STEP 3: Calculate totals
                $subtotal = 0;
                $plate_total = 0;
                
                foreach ($cartItems as $item) {
                    $subtotal += $item->quantity * $item->unit_price;
                    $plate_total += $item->quantity * $item->plate_price;
                }
                
                $deliveryMethod = \App\Models\DeliveryMethod::find($validated['delivery_method_id']);
                $totalAmount = $subtotal + $plate_total + ($deliveryMethod ? $deliveryMethod->fee : 0);

                // STEP 4: Generate order ID
                $orderId = 'ORD-' . strtoupper(\Illuminate\Support\Str::random(8));

                // STEP 5: Create the order row
                $order = Order::create([
                    'id' => $orderId,
                    'customer_id' => $user->id,
                    'address_id' => $validated['address_id'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'delivery_method_id' => $validated['delivery_method_id'],
                    'production_notes' => $validated['production_notes'] ?? null,
                    'total_amount' => $totalAmount,
                    'total_discount_amount' => 0,
                    'status' => 'PENDING',
                ]);

                // STEP 6: For each cart_item, create order_item row
                /*
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

                // STEP 8: Delete processed cart_items
                \App\Models\CartItem::whereIn('id', $validated['cart_item_ids'])->delete();
                */

                // STEP 9: Return JSON response (201)
                return response()->json([
                    "id" => $orderId,
                    "total_amount" => $totalAmount,
                    "total_discount_amount" => 0,
                    "status" => "PENDING"
                ], 201);
            });
        } catch (\Throwable $e) {
            Log::error('OrderController@store failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create order: ' . $e->getMessage()], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\OrderItem;
use App\Models\OrderItemColor;
use App\Models\PaymentCode;

class AdminOrderController extends Controller
{
    /**
     * Get order-related analytics and lists for the Orders view.
     */
    public function index(): JsonResponse
    {
        $stats = $this->getOrderStats();
        $orderStatusDistribution = $this->getOrderStatusDistribution();
        $topCustomers = $this->getTopCustomers();
        $customers = $this->getCustomersList();
        $allOrders = $this->getAllOrders();

        return response()->json([
            'stats' => $stats,
            'orderStatusDistribution' => $orderStatusDistribution,
            'topCustomers' => $topCustomers,
            'customers' => $customers,
            'orders' => $allOrders,
        ]);
    }

    /**
     * Calculate core order statistics.
     */
    private function getOrderStats(): array
    {
        $totalOrders = Order::count();
        $allowedStatuses = ['UNPAID', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        $deliveredOrdersCount = Order::where('status', 'DELIVERED')->count();
        $completionRate = $totalOrders > 0 ? round(($deliveredOrdersCount / $totalOrders) * 100, 2) : 0;

        $avgRating = Order::where('rating', '>', 0)->avg('rating') ?: 0;
        $orderVolume = (float) Order::sum('total_amount');

        return [
            'total_orders' => $totalOrders,
            'completed_count' => $deliveredOrdersCount,
            'completion_rate' => $completionRate,
            'satisfaction_quotient' => round($avgRating, 1),
            'order_volume' => $orderVolume,
        ];
    }

    /**
     * Get distribution of orders by status for Pie Chart.
     */
    private function getOrderStatusDistribution(): iterable
    {
        return Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $status = strtoupper($item->status);
                $colors = [
                    'PENDING' => '#f59e0b',
                    'PROCESSING' => '#3b82f6',
                    'SHIPPED' => '#10b981',
                    'COMPLETED' => '#10b981',
                    'DELIVERED' => '#10b981',
                    'CANCELLED' => '#ef4444',
                ];

                return [
                    'name' => $item->status,
                    'value' => (int) $item->count,
                    'color' => $colors[$status] ?? '#cbd5e1',
                ];
            });
    }

    /**
     * Get top customers by order count.
     */
    private function getTopCustomers(): iterable
    {
        return Customer::orderBy('orders', 'desc')
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => "{$c->first_name} {$c->last_name}",
                'order_count' => $c->orders,
                'total_spent' => (float) $c->total_orders_value,
            ]);
    }

    /**
     * Get all customers with their basic stats.
     */
    private function getCustomersList(): iterable
    {
        return Customer::orderBy('orders', 'desc')->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => "{$c->first_name} {$c->last_name}",
            'first_name' => $c->first_name,
            'last_name' => $c->last_name,
            'email' => $c->email,
            'role' => $c->role,
            'profile_picture' => $c->profile_picture,
            'orderCount' => $c->orders,
            'totalSpent' => (float) $c->total_orders_value,
        ]);
    }

    /**
     * Get all orders with customer details.
     */
    private function getAllOrders(): iterable
    {
        return Order::with(['customer', 'items.product', 'items.variant', 'items.colors.colorDetails'])
            ->latest()
            ->get()
            ->map(fn ($o) => [
                'order_id' => (string) $o->id,
                'user_id' => (string) $o->customer_id,
                'total_amount' => (float) $o->total_amount,
                'status' => $o->status,
                'created_at' => $o->created_at->toIso8601String(),
                'rating' => $o->rating,
                'feedback' => $o->feedback,
                'complaint' => $o->complaint,
                'discount' => [
                    'total_discount_amount' => (float) $o->total_discount_amount,
                ],
                'products' => $o->items->map(fn ($item) => [
                    'id' => $item->id,
                    'order_id' => $item->order_id,
                    'customer_id' => $item->customer_id,
                    'productId' => $item->product_id,
                    'productName' => $item->product?->name ?? 'Deleted Product',
                    'productImage' => $item->product?->image_url ?? '',
                    'short_description' => $item->product?->small_desc ?? '',
                    'category' => $item->product?->category ?? 'General',
                    'quantity' => $item->quantity,
                    'variant' => [
                        'id' => $item->variant_id,
                        'size' => $item->variant?->size ?? 'N/A',
                        'unitPrice' => (float) $item->unit_price,
                    ],
                    'colors' => $item->colors->map(fn ($c) => [
                        'name' => $c->colorDetails?->name ?? 'Unknown',
                        'hex' => $c->colorDetails?->hex ?? '#000000',
                    ]),
                    'plate' => $item->screenplate ? [
                        'id' => $item->screenplate->id,
                        'name' => $item->screenplate->name,
                        'setupFee' => (float) $item->screenplate->setup_fee,
                        'printPricePerUnit' => (float) $item->plate_price,
                    ] : null,
                    'customRequirements' => $o->production_notes,
                    'created_at' => $o->created_at->toISOString(),
                ]),
            ]);
    }

    /**
     * Directly create an order for a customer (Admin side bypass)
     */
    public function storeDirect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'address_id' => 'required|string',
            'delivery_method_id' => 'required|string|exists:delivery_methods,id',
            'payment_method_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|string|exists:products,id',
            'items.*.variant_id' => 'nullable|string',
            'items.*.screenplate_id' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.plate_price' => 'nullable|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.colors' => 'nullable|array',
            'items.*.colors.*.color_id' => 'required|string',
            'items.*.colors.*.channel_label' => 'required|string',
            'items.*.colors.*.channel_order' => 'required|integer',
            'total_amount' => 'required|numeric|min:0',
            'generate_payment_code' => 'nullable|boolean',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $orderId = 'ORD-' . strtoupper(Str::random(10));
                
                $paymentCodeId = null;
                if (!empty($validated['generate_payment_code'])) {
                    $paymentCodeId = 'PAY-' . strtoupper(Str::random(8));
                    PaymentCode::create([
                        'id' => $paymentCodeId,
                        'code' => strtoupper(Str::random(6)),
                        'is_used' => false,
                        'created_at' => now(),
                    ]);
                }
                
                $order = Order::create([
                    'id' => $orderId,
                    'customer_id' => $validated['customer_id'],
                    'address_id' => $validated['address_id'],
                    'payment_method_id' => $validated['payment_method_id'] ?? null,
                    'payment_code_id' => $paymentCodeId,
                    'delivery_method_id' => $validated['delivery_method_id'],
                    'production_notes' => $validated['notes'] ?? null,
                    'total_discount_amount' => 0,
                    'total_amount' => $validated['total_amount'],
                    'status' => 'PENDING',
                    'rating' => 0,
                ]);

                // Update Customer Lifetime Value
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $customer->increment('orders');
                    $customer->increment('total_orders_value', $validated['total_amount']);
                }

                foreach ($validated['items'] as $item) {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'customer_id' => $validated['customer_id'],
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'] ?? null,
                        'screenplate_id' => $item['screenplate_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'plate_price' => $item['plate_price'] ?? 0,
                    ]);

                    // Update variant stock
                    if (!empty($item['variant_id'])) {
                        DB::statement('
                            UPDATE product_variants 
                            SET stock = GREATEST(0, CAST(stock AS SIGNED) - ?)
                            WHERE variant_id = ?
                        ', [
                            $item['quantity'],
                            $item['variant_id'],
                        ]);
                    }

                    // Update product sold and stock status
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
                        $item['quantity'],
                        $item['product_id'],
                    ]);

                    // Add colors
                    if (!empty($item['colors'])) {
                        foreach ($item['colors'] as $color) {
                            OrderItemColor::create([
                                'order_item_id' => $orderItem->id,
                                'color_id' => $color['color_id'],
                                'channel_label' => $color['channel_label'],
                                'channel_order' => $color['channel_order'],
                            ]);
                        }
                    }
                }

                return response()->json([
                    'id' => $orderId,
                    'total_amount' => $validated['total_amount'],
                    'status' => $order->status,
                ], 201);
            });
        } catch (\Throwable $e) {
            \Log::error('AdminOrderController@storeDirect failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create direct order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete an order and revert all associated inventory and customer statistics.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $order = Order::with('items')->find($id);
            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            DB::transaction(function () use ($order) {
                // 1. Revert customer stats
                $customer = Customer::find($order->customer_id);
                if ($customer) {
                    $customer->decrement('orders');
                    $customer->decrement('total_orders_value', $order->total_amount);
                    
                    // Prevent stats from going below zero
                    if ($customer->orders < 0) {
                        $customer->orders = 0;
                    }
                    if ($customer->total_orders_value < 0) {
                        $customer->total_orders_value = 0;
                    }
                    $customer->save();
                }

                // 2. Revert stock levels and sold statistics
                foreach ($order->items as $item) {
                    // Revert variant stock if a variant is associated
                    if (!empty($item->variant_id)) {
                        DB::statement('
                            UPDATE product_variants 
                            SET stock = stock + ?
                            WHERE variant_id = ?
                        ', [
                            $item->quantity,
                            $item->variant_id,
                        ]);
                    }

                    // Revert product sold statistics and recalculate stock status
                    DB::statement('
                        UPDATE products 
                        SET 
                            total_sold = GREATEST(0, CAST(total_sold AS SIGNED) - ?),
                            is_in_stock = (
                                SELECT EXISTS(
                                    SELECT 1 FROM product_variants 
                                    WHERE product_id = products.id 
                                    AND stock >= products.min_order
                                )
                            )
                        WHERE id = ?
                    ', [
                        $item->quantity,
                        $item->product_id,
                    ]);

                    // 3. Delete associated colors for this order item
                    OrderItemColor::where('order_item_id', $item->id)->delete();
                }

                // 4. Delete associated order items
                OrderItem::where('order_id', $order->id)->delete();

                // 5. Save payment code ID and delete the order record first (to avoid foreign key constraint failure)
                $paymentCodeId = $order->payment_code_id;
                $order->delete();

                // 6. Now delete the associated payment code since the referencing order is gone
                if ($paymentCodeId) {
                    PaymentCode::where('id', $paymentCodeId)->delete();
                }
            });

            return response()->json([
                'message' => 'Order deleted and statistics successfully reverted',
            ], 200);

        } catch (\Throwable $e) {
            \Log::error('AdminOrderController@destroy failed', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Failed to delete order: ' . $e->getMessage(),
            ], 500);
        }
    }
}

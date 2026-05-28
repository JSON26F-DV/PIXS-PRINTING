<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
}

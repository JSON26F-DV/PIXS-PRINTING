<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Update order status from the dashboard queue.
     */
    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $status = $request->input('status');

        $allowedStatuses = ['UNPAID', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND'];
        if (! in_array($status, $allowedStatuses)) {
            return response()->json(['message' => 'Invalid status update'], 422);
        }

        $order->status = $status;
        $order->save();

        return response()->json([
            'message' => "Order {$id} status updated to {$status}",
            'status' => $status,
        ]);
    }

    /**
     * Get aggregated dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $revenueData = $this->getRevenueMetrics();
        $expenditureData = $this->getExpenditureMetrics();
        $orderStatusData = $this->getOrderStatusMetrics();
        $pendingQueue = $this->getPendingQueue();
        $loyaltyMetrics = $this->getLoyaltyMetrics();
        $recentOrders = $this->getHistoricalRegistry();

        return response()->json([
            'totalRevenue' => $revenueData['total'],
            'totalExpenditure' => $expenditureData['total'],
            'revenuePoints' => $revenueData['points'],
            'revenueTableData' => $revenueData['tableData'],
            'expenditurePoints' => $expenditureData['points'],
            'orderStatusData' => $orderStatusData,
            'pendingQueue' => $pendingQueue,
            'topLoyalists' => $loyaltyMetrics['topLoyalists'],
            'loyaltyDistribution' => $loyaltyMetrics['loyaltyDistribution'],
            'recentOrders' => $recentOrders,
            'totalOrders' => Order::count(),
            'totalCustomers' => Customer::count(),
        ]);
    }

    /**
     * Calculate revenue metrics and data points.
     */
    private function getRevenueMetrics(): array
    {
        $customerRevenue = Customer::sum('total_orders_value');

        $orderPoints = Order::selectRaw('DATE(created_at) as date, SUM(total_amount) as total_amount')
            ->groupBy('date')
            ->get();

        $unifiedPoints = $orderPoints->map(function ($row) {
            return [
                'date' => $row->date,
                'total_amount' => (float) $row->total_amount,
            ];
        })->values();

        $tableData = Order::with('customer')
            ->latest()
            ->take(15)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'date' => $o->created_at->toDateTimeString(),
                'customer' => $o->customer ? "{$o->customer->first_name} {$o->customer->last_name}" : 'Anonymous',
                'amount' => (float) $o->total_amount,
                'discount' => (float) $o->total_discount_amount,
                'status' => $o->status,
            ]);

        return [
            'total' => $customerRevenue,
            'points' => $unifiedPoints,
            'tableData' => $tableData,
        ];
    }

    private function getExpenditureMetrics(): array
    {
        // Total expenditure from expenditures table only
        $totalExpenditure = DB::table('expenditures')->sum('amount');

        // Data points grouped by date
        $expenditurePoints = DB::table('expenditures')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as value')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return [
            'total' => $totalExpenditure,
            'points' => $expenditurePoints,
        ];
    }

    /**
     * Get order status distribution for charts.
     */
    private function getOrderStatusMetrics(): iterable
    {
        return Order::select('status', DB::raw('count(*) as value'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $colors = [
                    'PENDING' => '#f59e0b',
                    'PROCESSING' => '#3b82f6',
                    'SHIPPED' => '#10b981',
                    'DELIVERED' => '#10b981',
                    'CANCELLED' => '#ef4444',
                    'REFUND' => '#a855f7',
                ];

                return [
                    'name' => $item->status,
                    'value' => (int) $item->value,
                    'color' => $colors[$item->status] ?? '#cbd5e1',
                ];
            });
    }

    private function getPendingQueue(): iterable
    {
        return Order::where('status', 'PENDING')
            ->with(['customer', 'items.product'])
            ->latest()
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'customerName' => $order->customer ? "{$order->customer->first_name} {$order->customer->last_name}" : 'Anonymous',
                'total' => (float) $order->total_amount,
                'status' => $order->status,
                'type' => 'Order',
                'createdAt' => $order->created_at->toIso8601String(),
                'itemName' => $order->items->first()?->product?->name ?? 'Order',
            ]);
    }

    /**
     * Get top loyalists and general loyalty distribution.
     */
    private function getLoyaltyMetrics(): array
    {
        $topLoyalists = Customer::orderBy('total_orders_value', 'desc')
            ->take(10)
            ->get()
            ->map(fn ($customer) => [
                'name' => "{$customer->first_name} {$customer->last_name}",
                'transactions' => $customer->orders,
                'spent' => (float) $customer->total_orders_value,
            ]);

        $loyaltyDistribution = Customer::orderBy('orders', 'asc')
            ->get()
            ->map(fn ($customer) => [
                'name' => "{$customer->first_name} {$customer->last_name}",
                'transactions' => $customer->orders,
                'spent' => (float) $customer->total_orders_value,
            ]);

        return compact('topLoyalists', 'loyaltyDistribution');
    }

    private function getHistoricalRegistry(): iterable
    {
        $orders = Order::latest()
            ->with(['customer', 'items.product'])
            ->take(25)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'customerName' => $order->customer ? "{$order->customer->first_name} {$order->customer->last_name}" : 'Anonymous',
                'total' => (float) $order->total_amount,
                'status' => $order->status,
                'type' => 'Order',
                'createdAt' => $order->created_at->toIso8601String(),
                'itemName' => $order->items->first()?->product?->name ?? 'Order',
            ]);

        return $orders->sortByDesc('createdAt')->values();
    }
}

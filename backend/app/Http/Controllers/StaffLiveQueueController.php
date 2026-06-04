<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffLiveQueueController extends Controller
{
    /**
     * Fetch orders for staff live queue.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $employeeId = (string) $user->id;

        $assignments = [
            'allowed_categories' => $user->allowed_categories ?? [],
            'allowed_products'   => $user->allowed_products ?? [],
            'is_admin'           => $user->role === 'admin',
        ];

        // Fetch all orders with status PENDING
        $allPendingOrders = Order::with(['customer', 'items.product', 'items.variant', 'items.colors.colorDetails'])
            ->where('status', 'PENDING')
            ->latest()
            ->get();

        // Fetch all queue assignments: order_id => [employee_id, ...]
        $queueRows = DB::table('order_employee_queue')->get(['order_id', 'employee_id']);
        $queueMap  = [];
        foreach ($queueRows as $row) {
            $queueMap[(string) $row->order_id][] = (string) $row->employee_id;
        }

        $productionLogMap = DB::table('production_logs')->get()->keyBy('order_id');

        $pendingOrders    = [];
        $productionOrders = [];

        foreach ($allPendingOrders as $o) {
            $orderId = (string) $o->id;

            // If the user is not an admin, they MUST be explicitly assigned to see the order.
            if (! $assignments['is_admin']) {
                if (! isset($queueMap[$orderId]) || ! in_array($employeeId, $queueMap[$orderId], true)) {
                    continue; // Employee is not assigned to this order
                }
            }

            $formattedOrder = [
                'order_id'     => $orderId,
                'user_id'      => $o->customer ? "{$o->customer->first_name} {$o->customer->last_name}" : (string) $o->customer_id,
                'company_name' => $o->customer ? $o->customer->company_name : null,
                'customer_id'  => (string) $o->customer_id,
                'total_amount' => (float) $o->total_amount,
                'status'       => $o->status,
                'created_at'   => $o->created_at->toIso8601String(),
                'products'     => $o->items->map(fn ($item) => [
                    'id'               => $item->id,
                    'order_id'         => $item->order_id,
                    'customer_id'      => $item->customer_id,
                    'productId'        => $item->product_id,
                    'productName'      => $item->product?->name ?? 'Deleted Product',
                    'productImage'     => $item->product && $item->product->main_image
                        ? '/images/products/'.$item->product->main_image
                        : '',
                    'category'         => $item->product?->category?->label ?? 'General',
                    'quantity'         => $item->quantity,
                    'variant'          => [
                        'id'        => $item->variant_id,
                        'size'      => $item->variant?->size ?? 'N/A',
                        'unitPrice' => (float) $item->unit_price,
                    ],
                    'colors'           => $item->colors->map(fn ($c) => [
                        'name' => $c->colorDetails?->name ?? 'Unknown',
                        'hex'  => $c->colorDetails?->hex ?? '#000000',
                    ]),
                    'plate'            => $item->screenplate ? [
                        'id'               => $item->screenplate->id,
                        'name'             => $item->screenplate->name,
                        'setupFee'         => (float) $item->screenplate->setup_fee,
                        'printPricePerUnit'=> (float) $item->plate_price,
                    ] : null,
                    'customRequirements' => $o->production_notes,
                ])->toArray(),
            ];

            if ($productionLogMap->has($o->id)) {
                $log = $productionLogMap->get($o->id);
                $formattedOrder['task_status']   = $log->task_status;
                $formattedOrder['requested_at']  = $log->requested_at;
                $productionOrders[] = $formattedOrder;
            } else {
                $pendingOrders[] = $formattedOrder;
            }
        }

        return response()->json([
            'pending_orders'    => $pendingOrders,
            'production_orders' => $productionOrders,
            'assignments'       => $assignments,
        ]);
    }

    /**
     * Log production status (COMPLETED or NOT_COMPLETED) and notify customer.
     */
    public function updateTaskStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'task_status' => 'required|in:COMPLETED,NOT_COMPLETED',
            'message' => 'nullable|string|max:5000',
        ]);

        $user = $request->user();
        $employeeId = $user->id;

        $order = Order::find($id);
        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $customerId = $order->customer_id;
        $taskStatus = $validated['task_status'];

        // Define message text
        if ($taskStatus === 'COMPLETED') {
            $messageText = '[LIVE_QUEUE_COMPLETED] The production task for this order has been successfully completed.';
        } else {
            $messageText = '[LIVE_QUEUE_NOT_COMPLETED] '.(! empty($validated['message']) ? $validated['message'] : 'The production task for this order could not be completed at this time.');
        }

        try {
            DB::transaction(function () use ($id, $employeeId, $customerId, $taskStatus, $messageText) {
                // 1. Insert/Update into production_logs
                DB::table('production_logs')->updateOrInsert(
                    ['order_id' => $id],
                    [
                        'id' => 'prod_'.Str::random(10),
                        'employee_id' => $employeeId,
                        'task_status' => $taskStatus,
                        'requested_at' => now(),
                    ]
                );

                // 2. Create message in messages table with product_concern = 1
                $convId = $employeeId.'_'.$customerId;

                // Ensure conversation exists
                DB::insert('INSERT IGNORE INTO conversations (id, created_at, updated_at) VALUES (?, NOW(), NOW())', [$convId]);

                $msgId = 'msg_'.Str::random(10);
                DB::table('messages')->insert([
                    'id' => $msgId,
                    'conversation_id' => $convId,
                    'sender_id' => $employeeId,
                    'sender_type' => 'employee',
                    'receiver_id' => $customerId,
                    'receiver_type' => 'customer',
                    'message' => $messageText,
                    'reply_to_id' => null,
                    'order_id' => $id,
                    'screenplate_request_id' => null,
                    'payment_code_id' => null,
                    'product_concern' => 1,
                    'expenditures_id' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

            return response()->json(['message' => 'Task status logged and customer notified.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update task status: '.$e->getMessage()], 500);
        }
    }
}

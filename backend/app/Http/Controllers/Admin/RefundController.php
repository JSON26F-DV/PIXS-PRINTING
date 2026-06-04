<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RefundController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 50);

        $refunds = DB::table('refunds')
            ->select(
                'refunds.*',
                'customers.first_name as customer_first_name',
                'customers.last_name as customer_last_name',
                'customer_payment_methods.type as payment_method_type',
                'customer_payment_methods.masked_number as payment_method_masked_number',
                'customer_payment_methods.bank_name as payment_method_bank_name',
                'customer_payment_methods.provider as payment_method_provider',
                'payment_codes.code as payment_code'
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('customer_payment_methods', 'refunds.payment_id', '=', 'customer_payment_methods.id')
            ->leftJoin('payment_codes', 'refunds.payment_code_id', '=', 'payment_codes.id')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($refunds);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|string|max:20',
            'order_id' => 'nullable|string|max:30',
            'payment_id' => 'nullable|string|max:30',
            'amount' => 'required|numeric|min:0',
            'message' => 'nullable|string|max:5000',
            'generate_payment_code' => 'nullable|boolean',
        ]);

        $paymentCodeId = null;
        if ($validated['generate_payment_code'] ?? false) {
            $attempts = 0;
            do {
                $codeStr = 'PIXS-'.strtoupper(Str::random(10));
                $exists = DB::table('payment_codes')->where('code', $codeStr)->exists();
                $attempts++;
            } while ($exists && $attempts < 100);

            if ($attempts >= 100) {
                return response()->json(['message' => 'Failed to generate a unique payment code.'], 500);
            }

            $paymentCodeId = 'pc_'.Str::random(10);
            DB::table('payment_codes')->insert([
                'id' => $paymentCodeId,
                'code' => $codeStr,
                'is_used' => 0,
                'used_at' => null,
                'created_at' => now(),
            ]);
        }

        $refundId = 'ref_'.Str::random(10);

        // Determine message text — auto-generate if admin didn't provide one
        $messageText = $validated['message'] ?? null;
        if (! $messageText) {
            $messageText = 'Refund request'.($validated['order_id'] ? ' for Order ID: '.$validated['order_id'] : '').' — ₱'.number_format($validated['amount'], 2);
        }

        DB::table('refunds')->insert([
            'id' => $refundId,
            'customer_id' => $validated['customer_id'],
            'order_id' => $validated['order_id'] ?? null,
            'payment_id' => $validated['payment_id'] ?? null,
            'payment_code_id' => $paymentCodeId,
            'amount' => $validated['amount'],
            'message' => $messageText,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($validated['order_id'] ?? null) {
            DB::table('orders')
                ->where('id', $validated['order_id'])
                ->update(['status' => 'REFUND']);
        }

        // Create a corresponding expenditure with category = 'Refund'
        DB::table('expenditures')->insert([
            'category' => 'Refund',
            'amount' => $validated['amount'],
            'description' => 'Refund for Order ID: '.($validated['order_id'] ?? 'N/A'),
            'created_at' => now(),
        ]);

        // Create a message record linked to this refund
        $adminId = $request->user()->id;
        $convId = $adminId.'_'.$validated['customer_id'];

        DB::table('conversations')->insertOrIgnore([
            'id' => $convId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('messages')->insert([
            'id' => 'msg_'.Str::random(10),
            'conversation_id' => $convId,
            'sender_id' => $adminId,
            'sender_type' => 'employee',
            'receiver_id' => $validated['customer_id'],
            'receiver_type' => 'customer',
            'message' => $messageText,
            'refund_id' => $refundId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        AuditService::created('refund', $refundId, [
            'customer_id' => $validated['customer_id'],
            'amount' => $validated['amount'],
        ]);

        return response()->json([
            'message' => 'Refund created and expenditure tracked.',
            'data' => ['id' => $refundId],
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $refund = DB::table('refunds')
            ->select(
                'refunds.*',
                'customers.first_name as customer_first_name',
                'customers.last_name as customer_last_name',
                'customers.email as customer_email',
                'customer_payment_methods.type as payment_method_type',
                'customer_payment_methods.masked_number as payment_method_masked_number',
                'customer_payment_methods.bank_name as payment_method_bank_name',
                'customer_payment_methods.provider as payment_method_provider',
                'payment_codes.code as payment_code'
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('customer_payment_methods', 'refunds.payment_id', '=', 'customer_payment_methods.id')
            ->leftJoin('payment_codes', 'refunds.payment_code_id', '=', 'payment_codes.id')
            ->where('refunds.id', $id)
            ->first();

        if (! $refund) {
            return response()->json(['message' => 'Refund not found.'], 404);
        }

        return response()->json(['data' => $refund]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,completed,cancelled',
            'amount' => 'nullable|numeric|min:0',
            'message' => 'nullable|string|max:5000',
        ]);

        $updateData = array_filter([
            'status' => $validated['status'] ?? null,
            'amount' => $validated['amount'] ?? null,
            'message' => $validated['message'] ?? null,
        ], fn ($v) => $v !== null);

        if (($validated['status'] ?? '') === 'completed') {
            $updateData['processed_at'] = now();
        }

        if (! empty($updateData)) {
            $updateData['updated_at'] = now();
            DB::table('refunds')->where('id', $id)->update($updateData);
        }

        AuditService::updated('refund', $id, [], $updateData);

        return response()->json(['message' => 'Refund updated.']);
    }

    public function destroy(string $id): JsonResponse
    {
        DB::table('refunds')->where('id', $id)->delete();
        AuditService::deleted('refund', $id);

        return response()->json(['message' => 'Refund deleted.']);
    }

    public function customerPaymentMethods(string $customerId): JsonResponse
    {
        $paymentMethods = DB::table('customer_payment_methods')
            ->where('customer_id', $customerId)
            ->get();

        $paymentCodes = DB::table('payment_codes')
            ->join('orders', 'payment_codes.id', '=', 'orders.payment_code_id')
            ->where('orders.customer_id', $customerId)
            ->select('payment_codes.id', 'payment_codes.code', 'orders.total_amount as amount', 'payment_codes.created_at')
            ->get();

        return response()->json([
            'data' => [
                'payment_methods' => $paymentMethods,
                'payment_codes' => $paymentCodes,
            ],
        ]);
    }

    public function customerOrders(string $customerId): JsonResponse
    {
        $orders = Order::with('items.product')
            ->where('customer_id', $customerId)
            ->where('status', 'DELIVERED')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $orders->map(fn ($o) => [
                'id' => $o->id,
                'total_amount' => (float) $o->total_amount,
                'status' => $o->status,
                'created_at' => $o->created_at->toIso8601String(),
                'product_names' => $o->items->map(fn ($item) => $item->product?->name ?? 'Unknown Product')->toArray(),
            ]),
        ]);
    }
}

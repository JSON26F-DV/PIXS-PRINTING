<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
                'customer_payment_methods.provider as payment_method_provider'
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('customer_payment_methods', 'refunds.payment_id', '=', 'customer_payment_methods.id')
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
        ]);

        $refundId = 'ref_'.Str::random(10);

        DB::table('refunds')->insert([
            'id' => $refundId,
            'customer_id' => $validated['customer_id'],
            'order_id' => $validated['order_id'] ?? null,
            'payment_id' => $validated['payment_id'] ?? null,
            'amount' => $validated['amount'],
            'message' => $validated['message'] ?? null,
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
            'description' => 'Refund for Order ID: ' . ($validated['order_id'] ?? 'N/A'),
            'created_at' => now(),
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
                'customer_payment_methods.provider as payment_method_provider'
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('customer_payment_methods', 'refunds.payment_id', '=', 'customer_payment_methods.id')
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
            ->where('customer_id', $customerId)
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
        $orders = DB::table('orders')
            ->select('id', 'total_amount', 'status', 'created_at')
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $orders,
        ]);
    }
}

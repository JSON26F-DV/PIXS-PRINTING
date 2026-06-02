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
                'employees.first_name as employee_first_name',
                'employees.last_name as employee_last_name',
                'payment_codes.code as payment_code'
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('employees', 'refunds.employee_id', '=', 'employees.id')
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
            'payment_code_id' => 'nullable|string|max:30',
            'amount' => 'required|numeric|min:0',
            'message' => 'nullable|string|max:5000',
        ]);

        $admin = $request->user();
        $refundId = 'ref_'.Str::random(10);

        DB::table('refunds')->insert([
            'id' => $refundId,
            'employee_id' => $admin->id,
            'customer_id' => $validated['customer_id'],
            'order_id' => $validated['order_id'] ?? null,
            'payment_code_id' => $validated['payment_code_id'] ?? null,
            'amount' => $validated['amount'],
            'message' => $validated['message'] ?? null,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        AuditService::created('refund', $refundId, [
            'customer_id' => $validated['customer_id'],
            'amount' => $validated['amount'],
        ]);

        return response()->json([
            'message' => 'Refund created.',
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
                'employees.first_name as employee_first_name',
                'employees.last_name as employee_last_name',
            )
            ->leftJoin('customers', 'refunds.customer_id', '=', 'customers.id')
            ->leftJoin('employees', 'refunds.employee_id', '=', 'employees.id')
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
}

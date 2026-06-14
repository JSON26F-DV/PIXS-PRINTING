<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentCode;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminPaymentCodeController extends Controller
{
    /**
     * Display a listing of payment codes.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentCode::query();

        // Optional Search filter
        $search = $request->query('search');
        if ($search) {
            $query->where('code', 'like', '%'.$search.'%');
        }

        // Optional is_used filter
        $status = $request->query('status');
        if ($status === 'used') {
            $query->where('is_used', 1);
        } elseif ($status === 'unused') {
            $query->where('is_used', 0);
        }

        $codes = $query->orderBy('created_at', 'desc')->get();

        return response()->json($codes);
    }

    /**
     * Store newly generated payment codes.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:20|unique:payment_codes,code',
            'quantity' => 'nullable|integer|min:1|max:100',
        ]);

        $quantity = $validated['quantity'] ?? 1;
        $customCode = $validated['code'] ?? null;

        if ($customCode) {
            // Create a single custom payment code
            $paymentCode = PaymentCode::create([
                'id' => 'pc_'.Str::random(10),
                'code' => strtoupper($customCode),
                'is_used' => 0,
                'used_at' => null,
            ]);

            AuditService::created('payment_code', $paymentCode->id, ['code' => $paymentCode->code]);

            return response()->json([
                'message' => 'Custom payment code created successfully.',
                'data' => [$paymentCode],
            ], 201);
        }

        // Bulk or single random generation
        $createdCodes = [];
        DB::transaction(function () use ($quantity, &$createdCodes) {
            for ($i = 0; $i < $quantity; $i++) {
                // Ensure unique code generation
                $attempts = 0;
                do {
                    $codeStr = 'PIXS-'.strtoupper(Str::random(10));
                    $exists = DB::table('payment_codes')->where('code', $codeStr)->exists();
                    $attempts++;
                } while ($exists && $attempts < 100);

                if ($attempts >= 100) {
                    throw new \RuntimeException('Failed to generate a unique payment code.');
                }

                $createdCodes[] = PaymentCode::create([
                    'id' => 'pc_'.Str::random(10),
                    'code' => $codeStr,
                    'is_used' => 0,
                    'used_at' => null,
                ]);
            }
        });

        AuditService::log('bulk_create', 'payment_code', null, ['quantity' => $quantity]);

        return response()->json([
            'message' => "Successfully generated {$quantity} payment code(s).",
            'data' => $createdCodes,
        ], 201);
    }

    /**
     * Remove the specified payment code from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $paymentCode = PaymentCode::find($id);

        if (! $paymentCode) {
            return response()->json(['message' => 'Payment code not found.'], 404);
        }

        // Security check: do not allow deleting used codes to preserve order history
        if ($paymentCode->is_used) {
            return response()->json([
                'message' => 'Cannot delete a payment code that has already been used.',
            ], 422);
        }

        try {
            $paymentCode->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            // Check for integrity constraint violation (SQLSTATE 23000)
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'Integrity constraint violation')) {
                return response()->json([
                    'message' => 'Cannot delete this payment code because it is linked to refund or order records.',
                ], 422);
            }
            throw $e;
        }

        AuditService::deleted('payment_code', $id);

        return response()->json(['message' => 'Payment code deleted successfully.']);
    }
}

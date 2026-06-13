<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DiscountController extends Controller
{
    /**
     * List all discounts (Admin).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Discount::with(['customer', 'product'])->get(),
        ]);
    }

    /**
     * Generate new discount code (Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:150',
            'customer_id' => 'nullable|string',
            'assigned_user_id' => 'nullable|string',
            'product_id' => 'nullable|string|exists:products,id',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
            'code' => 'nullable|string|max:50|unique:discounts,code',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
        ]);

        $code = ! empty($validated['code'])
            ? strtoupper($validated['code'])
            : null;

        $customerId = ! empty($validated['assigned_user_id'])
            ? $validated['assigned_user_id']
            : ($validated['customer_id'] ?? null);

        $discount = Discount::create([
            'id' => 'dsc_'.Str::random(10),
            'title' => $validated['title'] ?? null,
            'customer_id' => $customerId,
            'product_id' => $validated['product_id'] ?? null,
            'variant_id' => $validated['variant_id'] ?? null,
            'code' => $code,
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_spend' => $validated['min_spend'] ?? 0,
            'expires_at' => $validated['expires_at'] ?? null,
            'already_used' => false,
            'created_at' => now(),
        ]);

        AuditService::created('discount', $discount->id, ['code' => $code, 'type' => $validated['type']]);

        return response()->json([
            'message' => 'Discount code generated.',
            'data' => $discount,
        ], 201);
    }

    /**
     * Get available discounts for authenticated customer.
     */
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();

        $discounts = Discount::with(['product', 'variant'])
            ->whereNull('customer_id')
            ->orWhere('customer_id', $user->id)
            ->get();

        return response()->json([
            'data' => $discounts,
        ]);
    }

    /**
     * Verify a discount code before applying.
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'total_amount' => 'required|numeric',
            'product_ids' => 'nullable|array', // Array of product IDs in cart
        ]);

        $user = $request->user();
        $discount = Discount::where('code', $validated['code'])->first();

        if (! $discount) {
            return response()->json(['message' => 'Invalid discount code.'], 404);
        }

        if ($discount->already_used) {
            return response()->json(['message' => 'This discount code has already been used.'], 400);
        }

        if ($discount->expires_at && $discount->expires_at->isPast()) {
            return response()->json(['message' => 'This discount code has expired.'], 400);
        }

        if ($discount->customer_id && $discount->customer_id !== $user->id) {
            return response()->json(['message' => 'This discount code is not valid for your account.'], 403);
        }

        if ($validated['total_amount'] < $discount->min_spend) {
            return response()->json([
                'message' => "This discount requires a minimum spend of {$discount->min_spend}.",
            ], 400);
        }

        // Product specific check
        if ($discount->product_id) {
            $productIds = $validated['product_ids'] ?? [];
            if (! in_array($discount->product_id, $productIds)) {
                return response()->json([
                    'message' => 'This discount applies only to a specific product not found in your cart.',
                ], 400);
            }
        }

        return response()->json([
            'message' => 'Discount applied successfully.',
            'data' => $discount,
        ]);
    }

    /**
     * Update an existing discount code (Admin).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $discount = Discount::find($id);
        if (! $discount) {
            return response()->json(['message' => 'Discount not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:150',
            'customer_id' => 'nullable|string',
            'assigned_user_id' => 'nullable|string',
            'product_id' => 'nullable|string|exists:products,id',
            'variant_id' => 'nullable|string|exists:product_variants,variant_id',
            'code' => 'nullable|string|max:50|unique:discounts,code,'.$id,
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
            'already_used' => 'nullable|boolean',
        ]);

        $customerId = ! empty($validated['assigned_user_id'])
            ? $validated['assigned_user_id']
            : ($validated['customer_id'] ?? null);

        $discount->update([
            'title' => $validated['title'] ?? null,
            'customer_id' => $customerId,
            'product_id' => $validated['product_id'] ?? null,
            'variant_id' => $validated['variant_id'] ?? null,
            'code' => ! empty($validated['code']) ? strtoupper($validated['code']) : null,
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_spend' => $validated['min_spend'] ?? 0,
            'expires_at' => $validated['expires_at'] ?? null,
            'already_used' => $validated['already_used'] ?? false,
        ]);

        AuditService::updated('discount', $id, [], $validated);

        return response()->json([
            'message' => 'Discount campaign updated.',
            'data' => Discount::with(['customer', 'product'])->find($id),
        ]);
    }

    /**
     * Delete an existing discount code (Admin).
     */
    public function destroy(string $id): JsonResponse
    {
        $discount = Discount::find($id);
        if (! $discount) {
            return response()->json(['message' => 'Discount not found.'], 404);
        }

        $discount->delete();

        AuditService::deleted('discount', $id);

        return response()->json([
            'message' => 'Discount campaign deleted.',
        ]);
    }
}

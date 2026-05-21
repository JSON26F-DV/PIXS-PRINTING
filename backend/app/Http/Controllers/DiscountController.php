<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Discount;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DiscountController extends Controller
{
    /**
     * List all discounts (Admin).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Discount::with(['customer', 'product'])->get()
        ]);
    }

    /**
     * Generate new discount code (Admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|string|exists:customers,id',
            'product_id' => 'nullable|string|exists:products,id',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
        ]);

        $discount = Discount::create([
            'id' => 'dsc_' . Str::random(10),
            'customer_id' => $validated['customer_id'] ?? null,
            'product_id' => $validated['product_id'] ?? null,
            'code' => strtoupper(Str::random(8)),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_spend' => $validated['min_spend'] ?? 0,
            'expires_at' => $validated['expires_at'] ?? null,
            'already_used' => false
        ]);

        return response()->json([
            'message' => 'Discount code generated.',
            'data' => $discount
        ], 201);
    }

    /**
     * Get available discounts for authenticated customer.
     */
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $discounts = Discount::where(function($query) use ($user) {
                $query->where('customer_id', $user->id)
                      ->orWhereNull('customer_id');
            })
            ->where('already_used', false)
            ->where(function($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->with('product')
            ->get();

        return response()->json([
            'data' => $discounts
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
            'product_ids' => 'nullable|array' // Array of product IDs in cart
        ]);

        $user = $request->user();
        $discount = Discount::where('code', $validated['code'])->first();

        if (!$discount) {
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
                'message' => "This discount requires a minimum spend of {$discount->min_spend}."
            ], 400);
        }

        // Product specific check
        if ($discount->product_id) {
            $productIds = $validated['product_ids'] ?? [];
            if (!in_array($discount->product_id, $productIds)) {
                return response()->json([
                    'message' => 'This discount applies only to a specific product not found in your cart.'
                ], 400);
            }
        }

        return response()->json([
            'message' => 'Discount applied successfully.',
            'data' => $discount
        ]);
    }
}

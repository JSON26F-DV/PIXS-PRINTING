<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $items = CartItem::with([
                'colors.color',
                'product.variants',
                'variant',
                'screenplate.compatibility',
                'screenplate.incompatibility',
            ])
                ->where('customer_id', $user->id)
                ->get();

            foreach ($items as $item) {
                if ($item->screenplate) {
                    $this->transformScreenplate($item->screenplate);
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $items,
            ]);
        } catch (\Throwable $e) {
            Log::error('CartController@index failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Failed to load cart'], 500);
        }
    }

    /**
     * Store or update a cart item.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'id' => 'required|string',
            'product_id' => 'required|string',
            'variant_id' => 'required|string',
            'screenplate_id' => 'nullable|string',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric',
            'plate_price' => 'nullable|numeric',
            'total_cart_price' => 'nullable|numeric',
            'selected' => 'nullable|boolean',
            'temp' => 'nullable|boolean',
            'colors' => 'nullable|array',
            'colors.*.id' => 'required|string',
            'colors.*.channel_label' => 'required|string|in:Primary,Secondary,Accent',
            'colors.*.channel_order' => 'required|integer',
        ]);

        try {
            return DB::transaction(function () use ($validated, $user) {
                $cartItem = CartItem::updateOrCreate(
                    ['id' => $validated['id'], 'customer_id' => $user->id],
                    [
                        'product_id' => $validated['product_id'],
                        'variant_id' => $validated['variant_id'],
                        'screenplate_id' => $validated['screenplate_id'],
                        'quantity' => $validated['quantity'],
                        'unit_price' => $validated['unit_price'],
                        'plate_price' => $validated['plate_price'] ?? 0,
                        'total_cart_price' => $validated['total_cart_price'] ?? 0,
                        'selected' => $validated['selected'] ?? false,
                        'temp' => $validated['temp'] ?? false,
                    ]
                );

                if (isset($validated['colors'])) {
                    // Refresh colors
                    $cartItem->colors()->delete();
                    foreach ($validated['colors'] as $color) {
                        $cartItem->colors()->create([
                            'color_id' => $color['id'],
                            'channel_label' => $color['channel_label'],
                            'channel_order' => $color['channel_order'],
                        ]);
                    }
                }

                $cartItem->load(['colors.color', 'product.variants', 'variant', 'screenplate.compatibility', 'screenplate.incompatibility']);
                if ($cartItem->screenplate) {
                    $this->transformScreenplate($cartItem->screenplate);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Cart updated',
                    'data' => $cartItem,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CartController@store failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to update cart'], 500);
        }
    }

    /**
     * Exclusive Buy Now Logic (Deselects all, then selects specific item)
     */
    public function buyNow(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'id' => 'required|string',
            'product_id' => 'required|string',
            'variant_id' => 'required|string',
            'screenplate_id' => 'nullable|string',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric',
            'plate_price' => 'nullable|numeric',
            'total_cart_price' => 'nullable|numeric',
            'temp' => 'nullable|boolean',
            'colors' => 'nullable|array',
            'colors.*.id' => 'required|string',
            'colors.*.channel_label' => 'required|string|in:Primary,Secondary,Accent',
            'colors.*.channel_order' => 'required|integer',
        ]);

        try {
            return DB::transaction(function () use ($validated, $user) {
                // Actively Deselect all other cart items so they do not bleed into the transaction queue
                CartItem::where('customer_id', $user->id)->update(['selected' => 0]);

                $cartItem = CartItem::updateOrCreate(
                    ['id' => $validated['id'], 'customer_id' => $user->id],
                    [
                        'product_id' => $validated['product_id'],
                        'variant_id' => $validated['variant_id'],
                        'screenplate_id' => $validated['screenplate_id'],
                        'quantity' => $validated['quantity'],
                        'unit_price' => $validated['unit_price'],
                        'plate_price' => $validated['plate_price'] ?? 0,
                        'total_cart_price' => $validated['total_cart_price'] ?? 0,
                        'selected' => 1,
                        'temp' => $validated['temp'] ?? false,
                    ]
                );

                if (isset($validated['colors'])) {
                    $cartItem->colors()->delete();
                    foreach ($validated['colors'] as $color) {
                        $cartItem->colors()->create([
                            'color_id' => $color['id'],
                            'channel_label' => $color['channel_label'],
                            'channel_order' => $color['channel_order'],
                        ]);
                    }
                }

                $cartItem->load(['colors.color', 'product.variants', 'variant', 'screenplate.compatibility', 'screenplate.incompatibility']);
                if ($cartItem->screenplate) {
                    $this->transformScreenplate($cartItem->screenplate);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Buy Now transaction staged',
                    'data' => $cartItem,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CartController@buyNow failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to initialize buy now workflow'], 500);
        }
    }

    /**
     * Update quantity/variant/colors of a cart item.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $cartItem = CartItem::where('id', $id)->where('customer_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'variant_id' => 'sometimes|string',
            'unit_price' => 'sometimes|numeric',
            'total_cart_price' => 'sometimes|numeric',
            'selected' => 'sometimes|boolean',
            'colors' => 'sometimes|array',
        ]);

        try {
            return DB::transaction(function () use ($validated, $cartItem, $request) {
                $cartItem->update($request->only(['quantity', 'variant_id', 'unit_price', 'total_cart_price', 'selected']));

                if (isset($validated['colors'])) {
                    $cartItem->colors()->delete();
                    foreach ($validated['colors'] as $index => $color) {
                        $cartItem->colors()->create([
                            'color_id' => $color['id'],
                            'channel_label' => $color['channel_label'] ?? ($index === 0 ? 'Primary' : ($index === 1 ? 'Secondary' : 'Accent')),
                            'channel_order' => $color['channel_order'] ?? $index,
                        ]);
                    }
                }

                $cartItem->load(['colors.color', 'product.variants', 'variant', 'screenplate.compatibility', 'screenplate.incompatibility']);
                if ($cartItem->screenplate) {
                    $this->transformScreenplate($cartItem->screenplate);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Item updated',
                    'data' => $cartItem,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CartController@update failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to update item'], 500);
        }
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        CartItem::where('id', $id)->where('customer_id', $user->id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Item removed',
        ]);
    }

    private function transformScreenplate($screenplate)
    {
        $screenplate->compatibilityMapped = $screenplate->compatibility->groupBy('product_id')->map(function ($rows, $productId) {
            return [
                'product_id' => $productId,
                'allowed_variants' => $rows->pluck('variant_id')->map(fn ($v) => $v ?? 'ALL')->toArray(),
                'print_price_per_unit' => $rows->pluck('print_price_per_unit', 'variant_id')->mapWithKeys(function ($price, $vId) {
                    return [$vId ?? 'ALL' => (float) $price];
                })->toArray(),
            ];
        })->values();

        $screenplate->incompatibilityMapped = $screenplate->incompatibility->groupBy('product_id')->map(function ($rows, $productId) {
            return [
                'product_id' => $productId,
                'variant_ids' => $rows->pluck('variant_id')->filter()->values()->toArray(),
            ];
        })->values();

        $screenplate->setRelation('compatibility', $screenplate->compatibilityMapped);
        $screenplate->setRelation('incompatibility', $screenplate->incompatibilityMapped);
    }
}

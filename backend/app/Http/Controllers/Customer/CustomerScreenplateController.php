<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Screenplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerScreenplateController extends Controller
{
    /**
     * Screenplates owned by the authenticated customer (matches `screenplates.owner_id`).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $plates = Screenplate::with(['compatibility', 'incompatibility'])
                ->where('owner_id', $user->id)
                ->orderBy('plate_name')
                ->get();

            // Transform for frontend if needed
            $transformed = $plates->map(function ($plate) {
                // Group compatibility by product_id
                $comp = $plate->compatibility->groupBy('product_id')->map(function ($items, $productId) {
                    $prices = [];
                    $variants = [];
                    foreach ($items as $item) {
                        if ($item->variant_id) {
                            // Find variant size from DB? For now assume variant_id is the size or we'll just use it
                            // Actually the frontend expects allowed_variants as array of sizes
                            $variants[] = $item->variant_id;
                            $prices[$item->variant_id] = (float) $item->print_price_per_unit;
                        } else {
                            // NULL variant_id means all variants
                            $variants[] = 'ALL';
                            $prices['ALL'] = (float) $item->print_price_per_unit;
                        }
                    }

                    return [
                        'product_id' => $productId,
                        'allowed_variants' => $variants,
                        'print_price_per_unit' => $prices,
                    ];
                })->values();

                $incomp = $plate->incompatibility->groupBy('product_id')->map(function ($items, $productId) {
                    return [
                        'product_id' => $productId,
                        'variant_ids' => $items->pluck('variant_id')->filter()->values()->toArray(),
                    ];
                })->values();

                return [
                    'id' => $plate->id,
                    'owner_id' => $plate->owner_id,
                    'plate_name' => $plate->plate_name,
                    'base_setup_fee' => (float) $plate->base_setup_fee,
                    'is_flatscreen' => (bool) $plate->is_flatscreen,
                    'channels' => (int) $plate->channels,
                    'alignment' => $plate->alignment,
                    'supported_alignments' => explode(',', $plate->supported_alignments),
                    'dimensions' => $plate->dimensions,
                    'image' => $plate->image,
                    'comment' => $plate->comment,
                    'technical_info' => $plate->technical_info,
                    'compatibility' => $comp,
                    'incompatibility' => $incomp,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $transformed,
            ]);
        } catch (\Throwable $e) {
            Log::error('CustomerScreenplateController@index failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to load screenplates.',
            ], 500);
        }
    }
}

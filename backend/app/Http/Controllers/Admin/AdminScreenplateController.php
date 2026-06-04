<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Screenplate;
use App\Models\ScreenplateCompatibility;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminScreenplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Screenplate::with(['compatibility', 'owner']);

            if ($request->has('owner_id')) {
                $query->where('owner_id', $request->owner_id);
            }

            $plates = $query->orderBy('plate_name')->get();

            return response()->json([
                'status' => 'success',
                'data' => $plates->map(fn ($plate) => $this->transformPlate($plate)),
            ]);
        } catch (\Throwable $e) {
            Log::error('AdminScreenplateController@index failed', ['message' => $e->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to load screenplates.'], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $plate = Screenplate::with(['compatibility', 'owner'])->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $this->transformPlate($plate),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Screenplate not found.'], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'owner_id' => 'required|string|exists:customers,id',
                'plate_name' => 'required|string|max:255',
                'image' => 'nullable|string',
                'channels' => 'required|integer|min:1|max:8',
                'alignment' => 'required|string',
                'supported_alignments' => 'nullable|array',
                'dimensions' => 'nullable|string|max:50',
                'technical_info' => 'nullable|string',
                'comment' => 'nullable|string',
                'base_setup_fee' => 'nullable|numeric|min:0',
                'is_flatscreen' => 'required|boolean',
                'compatibility' => 'nullable|array',
                'compatibility.*.product_id' => 'required|string',
                'compatibility.*.allowed_variants' => 'nullable|array',
                'compatibility.*.print_price_per_unit' => 'nullable|array',
            ]);

            $id = $this->generateNextId();

            DB::beginTransaction();

            Screenplate::create([
                'id' => $id,
                'owner_id' => $validated['owner_id'],
                'plate_name' => $validated['plate_name'],
                'image' => $validated['image'] ?? '',
                'channels' => $validated['channels'],
                'alignment' => $validated['alignment'],
                'supported_alignments' => isset($validated['supported_alignments']) ? implode(',', $validated['supported_alignments']) : 'Front',
                'dimensions' => $validated['dimensions'] ?? null,
                'technical_info' => $validated['technical_info'] ?? '',
                'comment' => $validated['comment'] ?? '',
                'base_setup_fee' => $validated['base_setup_fee'] ?? 0,
                'is_flatscreen' => $validated['is_flatscreen'] ?? false,
            ]);

            $this->syncCompatibility($id, $validated['compatibility'] ?? []);

            DB::commit();

            $plate = Screenplate::with(['compatibility'])->find($id);

            AuditService::created('screenplate', $id, [
                'plate_name' => $validated['plate_name'],
                'owner_id' => $validated['owner_id'],
            ]);

            return response()->json([
                'status' => 'success',
                'data' => $this->transformPlate($plate),
                'message' => 'Screenplate created successfully.',
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminScreenplateController@store failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to create screenplate.'], 500);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $plate = Screenplate::findOrFail($id);

            $validated = $request->validate([
                'owner_id' => 'sometimes|string|exists:customers,id',
                'plate_name' => 'sometimes|string|max:255',
                'image' => 'nullable|string',
                'channels' => 'sometimes|integer|min:1|max:8',
                'alignment' => 'sometimes|string',
                'supported_alignments' => 'nullable|array',
                'dimensions' => 'nullable|string|max:50',
                'technical_info' => 'nullable|string',
                'comment' => 'nullable|string',
                'base_setup_fee' => 'nullable|numeric|min:0',
                'is_flatscreen' => 'sometimes|boolean',
                'compatibility' => 'nullable|array',
                'compatibility.*.product_id' => 'required|string',
                'compatibility.*.allowed_variants' => 'nullable|array',
                'compatibility.*.print_price_per_unit' => 'nullable|array',
            ]);

            DB::beginTransaction();

            $updateData = [];
            foreach (['owner_id', 'plate_name', 'image', 'channels', 'alignment', 'dimensions', 'technical_info', 'comment', 'base_setup_fee', 'is_flatscreen'] as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $validated[$field];
                }
            }
            if ($request->has('supported_alignments')) {
                $updateData['supported_alignments'] = implode(',', $validated['supported_alignments']);
            }

            if (! empty($updateData)) {
                $plate->update($updateData);
            }

            if ($request->has('compatibility')) {
                ScreenplateCompatibility::where('screenplate_id', $id)->delete();
                $this->syncCompatibility($id, $validated['compatibility']);
            }

            DB::commit();

            $plate->load(['compatibility']);

            AuditService::updated('screenplate', $id, [], $updateData);

            return response()->json([
                'status' => 'success',
                'data' => $this->transformPlate($plate),
                'message' => 'Screenplate updated successfully.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('AdminScreenplateController@update failed', ['message' => $e->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to update screenplate.'], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $plate = Screenplate::findOrFail($id);
            $plate->delete();

            AuditService::deleted('screenplate', $id);

            return response()->json([
                'status' => 'success',
                'message' => 'Screenplate deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Failed to delete screenplate.'], 500);
        }
    }

    public function uploadImage(Request $request, string $id): JsonResponse
    {
        try {
            $plate = Screenplate::findOrFail($id);

            $request->validate([
                'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:3072',
            ]);

            $file = $request->file('image');
            $targetDir = base_path('../frontend/public/images/screenplate');

            if (! is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            $filename = 'SP-'.Str::uuid7()->toString().'.'.$file->getClientOriginalExtension();
            $file->move($targetDir, $filename);

            // Delete old file if present
            if ($plate->image && $plate->image !== '') {
                $oldPath = $targetDir.'/'.$plate->image;
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $plate->update(['image' => $filename]);

            AuditService::updated('screenplate', $id, [], ['image' => $filename]);

            return response()->json([
                'status' => 'success',
                'data' => ['image' => $filename],
                'message' => 'Image uploaded successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('AdminScreenplateController@uploadImage failed', ['message' => $e->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to upload image.'], 500);
        }
    }

    private function transformPlate($plate): array
    {
        $comp = $plate->compatibility->groupBy('product_id')->map(function ($items, $productId) {
            $prices = [];
            $variants = [];
            foreach ($items as $item) {
                if ($item->variant_id) {
                    $variants[] = $item->variant_id;
                    $prices[$item->variant_id] = (float) $item->print_price_per_unit;
                } else {
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

        return [
            'id' => $plate->id,
            'owner_id' => $plate->owner_id,
            'plate_name' => $plate->plate_name,
            'base_setup_fee' => (float) $plate->base_setup_fee,
            'is_flatscreen' => (bool) $plate->is_flatscreen,
            'channels' => (int) $plate->channels,
            'alignment' => $plate->alignment,
            'supported_alignments' => explode(',', $plate->supported_alignments ?: 'Front'),
            'dimensions' => $plate->dimensions,
            'image' => $plate->image,
            'comment' => $plate->comment,
            'technical_info' => $plate->technical_info,
            'compatibility' => $comp,
        ];
    }

    private function syncCompatibility(string $screenplateId, array $compatibility): void
    {
        foreach ($compatibility as $comp) {
            $productId = $comp['product_id'];
            $allowedVariants = $comp['allowed_variants'] ?? [];
            $prices = $comp['print_price_per_unit'] ?? [];

            if (! empty($allowedVariants)) {
                foreach ($allowedVariants as $variantId) {
                    ScreenplateCompatibility::create([
                        'screenplate_id' => $screenplateId,
                        'product_id' => $productId,
                        'variant_id' => $variantId,
                        'print_price_per_unit' => $prices[$variantId] ?? 0,
                    ]);
                }
            } else {
                ScreenplateCompatibility::create([
                    'screenplate_id' => $screenplateId,
                    'product_id' => $productId,
                    'variant_id' => null,
                    'print_price_per_unit' => $prices['ALL'] ?? 0,
                ]);
            }
        }
    }

    // Create a single compatibility row (product + optional variant)
    public function addCompatibility(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|string|exists:products,id',
                'variant_id' => 'nullable|string',
                'print_price_per_unit' => 'nullable|numeric',
            ]);

            $plate = Screenplate::findOrFail($id);

            $row = ScreenplateCompatibility::create([
                'screenplate_id' => $plate->id,
                'product_id' => $validated['product_id'],
                'variant_id' => $validated['variant_id'] ?? null,
                'print_price_per_unit' => $validated['print_price_per_unit'] ?? 0,
            ]);

            return response()->json(['status' => 'success', 'data' => $row]);
        } catch (\Throwable $e) {
            Log::error('AdminScreenplateController@addCompatibility failed', ['message' => $e->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to add compatibility.'], 500);
        }
    }

    // Remove compatibility rows by product_id and optional variant_id
    public function removeCompatibility(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|string|exists:products,id',
                'variant_id' => 'nullable|string',
            ]);

            $plate = Screenplate::findOrFail($id);

            $query = ScreenplateCompatibility::where('screenplate_id', $plate->id)
                ->where('product_id', $validated['product_id']);

            if (array_key_exists('variant_id', $validated) && $validated['variant_id'] !== null) {
                $query->where('variant_id', $validated['variant_id']);
            } else {
                $query->whereNull('variant_id');
            }

            $deleted = $query->delete();

            return response()->json(['status' => 'success', 'deleted' => $deleted]);
        } catch (\Throwable $e) {
            Log::error('AdminScreenplateController@removeCompatibility failed', ['message' => $e->getMessage()]);

            return response()->json(['status' => 'error', 'message' => 'Failed to remove compatibility.'], 500);
        }
    }

    private function generateNextId(): string
    {
        $lastId = Screenplate::orderByDesc('id')->lockForUpdate()->value('id');
        $nextNum = $lastId ? (int) substr($lastId, 3) + 1 : 1;

        return 'SP-'.str_pad((string) $nextNum, 3, '0', STR_PAD_LEFT);
    }
}

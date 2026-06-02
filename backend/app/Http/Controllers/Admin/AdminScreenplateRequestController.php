<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ScreenplateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminScreenplateRequestController extends Controller
{
    public function index(): JsonResponse
    {
        $requests = ScreenplateRequest::with(['customer', 'product', 'variant'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests,
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Approved,Rejected,Pending',
        ]);

        $screenplateRequest = ScreenplateRequest::findOrFail($id);
        $screenplateRequest->status = $validated['status'];
        $screenplateRequest->save();

        return response()->json([
            'status' => 'success',
            'data' => $screenplateRequest,
        ]);
    }

    public function updateProductVisibility(Request $request, $productId): JsonResponse
    {
        $validated = $request->validate([
            'is_need_screenplate' => 'required|boolean',
        ]);

        $product = Product::findOrFail($productId);
        $product->is_need_screenplate = $validated['is_need_screenplate'];
        $product->save();

        return response()->json([
            'status' => 'success',
            'data' => $product,
        ]);
    }

    public function updateVariantVisibility(Request $request, $variantId): JsonResponse
    {
        $validated = $request->validate([
            'is_need_screenplate' => 'required|boolean',
        ]);

        $variant = ProductVariant::findOrFail($variantId);
        $variant->is_need_screenplate = $validated['is_need_screenplate'];
        $variant->save();

        return response()->json([
            'status' => 'success',
            'data' => $variant,
        ]);
    }
}

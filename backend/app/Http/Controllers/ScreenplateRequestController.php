<?php

namespace App\Http\Controllers;

use App\Models\ScreenplateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ScreenplateRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $requests = ScreenplateRequest::where('customer_id', $user->id)
            ->with(['product'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('sanctum')->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'product_id' => 'required|string|exists:products,id',
                'variant_id' => 'required|string|exists:product_variants,variant_id',
                'color_count' => 'required|integer|min:1|max:3',
                'alignment' => 'required|string|in:Front,Back-to-Back,Triple Logo,Back to Back',
                'reference_image' => 'nullable|string', // Optional Base64
                'comment' => 'nullable|string',
                'calculated_total' => 'required|numeric',
            ]);

            $imagePath = null;
            if ($request->filled('reference_image')) {
                try {
                    $imageData = $validated['reference_image'];
                    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                        $imageData = substr($imageData, strpos($imageData, ',') + 1);
                        $type = strtolower($type[1]); // jpg, png, etc

                        if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                            throw new \Exception('invalid image type');
                        }
                        $imageData = base64_decode($imageData);

                        if ($imageData === false) {
                            throw new \Exception('base64_decode failed');
                        }
                    } else {
                        throw new \Exception('did not match data URI with image data');
                    }

                    $fileName = 'SPR_' . time() . '_' . Str::random(5) . '.' . $type;
                    
                    // Specific path request: frontend/src/assets/message_media
                    $savePath = base_path('../frontend/src/assets/message_media');
                    if (!file_exists($savePath)) {
                        mkdir($savePath, 0755, true);
                    }
                    
                    file_put_contents($savePath . '/' . $fileName, $imageData);
                    $imagePath = $fileName;
                } catch (\Throwable $e) {
                    Log::error('Image saving failed', ['error' => $e->getMessage()]);
                    // Fallback or handle error
                }
            }

            // Map frontend naming to DB naming if necessary
            $alignment = $validated['alignment'];
            if ($alignment === 'Back to Back') {
                $alignment = 'Back-to-Back';
            }

            $screenplateRequest = ScreenplateRequest::create([
                'id' => 'SPR-' . strtoupper(Str::random(10)),
                'customer_id' => $user->id,
                'product_id' => $validated['product_id'],
                'variant_id' => $validated['variant_id'],
                'color_count' => $validated['color_count'],
                'alignment' => $alignment,
                'reference_image' => $imagePath,
                'comment' => $validated['comment'],
                'calculated_total' => $validated['calculated_total'],
                'status' => 'Pending',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Screenplate request created successfully.',
                'data' => $screenplateRequest
            ], 201);

        } catch (\Throwable $e) {
            Log::error('ScreenplateRequestController@store failed', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create screenplate request.',
            ], 500);
        }
    }
}

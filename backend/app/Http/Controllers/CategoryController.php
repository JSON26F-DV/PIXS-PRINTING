<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index(): JsonResponse
    {
        try {
            // SELECT id, label, count, image FROM categories ORDER BY label ASC
            // count is DB-managed via trigger
            $categories = DB::table('categories')
                ->select(['id', 'label', 'count', 'image'])
                ->orderBy('label', 'ASC')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $categories,
            ]);
        } catch (\Throwable $e) {
            Log::error('CategoryController@index failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to load categories.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'image' => 'nullable|string',
        ]);

        try {
            $id = strtoupper('CAT-'.Str::random(5));

            // Process the base64 image upload if provided
            $imageFilename = $this->processCategoryImage($validated['label'], $validated['image'] ?? null);

            $category = [
                'id' => $id,
                'label' => $validated['label'],
                'image' => $imageFilename,
            ];

            DB::table('categories')->insert($category);

            return response()->json([
                'status' => 'success',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            Log::error('CategoryController@store failed', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create category.',
            ], 500);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'image' => 'nullable|string',
        ]);

        try {
            $existing = DB::table('categories')->where('id', $id)->first();
            if (! $existing) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Category not found.',
                ], 404);
            }

            // Process new image upload and cleanup old one if it changes
            $imageFilename = $this->processCategoryImage(
                $validated['label'],
                $validated['image'] ?? null,
                $existing->image
            );

            DB::table('categories')->where('id', $id)->update([
                'label' => $validated['label'],
                'image' => $imageFilename,
            ]);

            $category = DB::table('categories')->where('id', $id)->first();

            return response()->json([
                'status' => 'success',
                'data' => $category,
            ]);
        } catch (\Throwable $e) {
            Log::error('CategoryController@update failed', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update category.',
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $existing = DB::table('categories')->where('id', $id)->first();
            if ($existing && $existing->image) {
                $targetPath = $this->frontendPublicPath('images/categories');
                $filePath = $targetPath.DIRECTORY_SEPARATOR.$existing->image;
                if (File::exists($filePath)) {
                    File::delete($filePath);
                }
            }

            DB::table('categories')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Category deleted.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete category.',
            ], 500);
        }
    }

    /**
     * Helper: Process base64 category image and return the filename, or null.
     */
    private function processCategoryImage(string $label, ?string $imageInput, ?string $oldImageFilename = null): ?string
    {
        if (! $imageInput) {
            return null;
        }

        // Check if it's a base64 data URL
        if (preg_match('/^data:image\/(\w+);base64,/', $imageInput, $type)) {
            $imageType = strtolower($type[1]); // png, jpeg, etc.

            if (in_array($imageType, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $base64Data = substr($imageInput, strpos($imageInput, ',') + 1);
                $decodedData = base64_decode($base64Data);

                if ($decodedData !== false) {
                    // Generate unique clean name
                    $cleanLabel = preg_replace('/[^A-Za-z0-9\-_]/', '-', $label);
                    $filename = strtolower($cleanLabel).'_'.time().'_'.uniqid().'.'.$imageType;

                    $targetPath = $this->frontendPublicPath('images/categories');
                    File::ensureDirectoryExists($targetPath);

                    file_put_contents($targetPath.DIRECTORY_SEPARATOR.$filename, $decodedData);

                    // Cleanup old image if any
                    if ($oldImageFilename) {
                        $oldFilePath = $targetPath.DIRECTORY_SEPARATOR.$oldImageFilename;
                        if (File::exists($oldFilePath)) {
                            File::delete($oldFilePath);
                        }
                    }

                    return $filename;
                }
            }
        }

        // If it is an external URL, return it
        if (filter_var($imageInput, FILTER_VALIDATE_URL)) {
            return $imageInput;
        }

        // If it is just a plain filename, keep it (taking the base name for safety)
        return basename($imageInput);
    }

    private function frontendPublicPath(string $directory = ''): string
    {
        return dirname(base_path()).DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.trim($directory, DIRECTORY_SEPARATOR);
    }
}

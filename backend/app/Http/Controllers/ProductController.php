<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductGallery;
use App\Models\ProductReview;
use App\Models\ProductTag;
use App\Models\ProductVariant;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * Public index: List products with filtering, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['category', 'variants']);

            // Category filter (by label)
            if ($request->filled('category')) {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('label', $request->category);
                });
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('id', 'LIKE', "%{$search}%");
                });
            }

            // Price range
            if ($request->filled('price_min')) {
                $query->where('base_price', '>=', (float) $request->price_min);
            }
            if ($request->filled('price_max')) {
                $query->where('base_price', '<=', (float) $request->price_max);
            }

            // Status filter
            if ($request->filled('status')) {
                $status = strtolower($request->status);
                if ($status === 'in stock') {
                    $query->where('is_in_stock', true);
                } elseif ($status === 'out of stock') {
                    $query->where('is_in_stock', false);
                }
            }

            // In stock only
            if ($request->boolean('in_stock_only')) {
                $query->where('is_in_stock', true);
            }

            // Min rating
            if ($request->filled('min_rating')) {
                $query->where('ratings', '>=', (float) $request->min_rating);
            }

            // Most sold filter (overrides sort if both present)
            if ($request->boolean('most_sold')) {
                $query->orderBy('total_sold', 'DESC');
            }

            // Sort
            if ($request->filled('sort')) {
                $sort = $request->sort;
                if (! $request->boolean('most_sold')) {
                    match ($sort) {
                        'Price: Low to High' => $query->orderBy('base_price', 'ASC'),
                        'Price: High to Low' => $query->orderBy('base_price', 'DESC'),
                        'Most Sold' => $query->orderBy('total_sold', 'DESC'),
                        'Highest Rating' => $query->orderBy('ratings', 'DESC'),
                        'A to Z' => $query->orderBy('name', 'ASC'),
                        'Z to A' => $query->orderBy('name', 'DESC'),
                        default => $query->orderBy('base_price', 'ASC'),
                    };
                }
            } else {
                $query->orderBy('base_price', 'ASC');
            }

            // Pagination
            $perPage = (int) $request->input('per_page', 20);
            $perPage = max(1, min(100, $perPage));
            $products = $query->paginate($perPage);

            return response()->json([
                'data' => collect($products->items())->map(function ($p) {
                    $data = $this->formatProduct($p);
                    $data['variants'] = $p->variants->map(fn ($v) => [
                        'variant_id' => $v->variant_id,
                        'size' => $v->size,
                        'width' => $v->width,
                        'height' => $v->height,
                        'price' => (float) $v->price,
                        'stock' => (int) $v->stock,
                    ]);

                    return $data;
                }),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@index failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load products.'], 500);
        }
    }

    /**
     * Show a single product with all relations (variants, gallery, tags, reviews).
     */
    public function show(string $id): JsonResponse
    {
        try {
            $product = Product::with(['category', 'variants', 'gallery', 'tags', 'reviews'])->find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $data = $this->formatProduct($product);
            $data['variants'] = $product->variants->map(fn ($v) => [
                'variant_id' => $v->variant_id,
                'size' => $v->size,
                'width' => $v->width,
                'height' => $v->height,
                'price' => (float) $v->price,
                'stock' => (int) $v->stock,
            ]);
            $data['gallery'] = $product->gallery->sortBy('sort_order')->values()->map(
                fn ($img) => $img->image_url
            );
            $data['tags'] = $product->tags->pluck('tag');
            $data['reviews'] = $product->reviews->map(fn ($r) => [
                'id' => $r->id,
                'rating' => (int) $r->rating,
                'feedback' => $r->feedback,
                'customer_name' => $r->customer_name ?? $r->customer?->user?->name ?? 'Anonymous',
                'created_at' => $r->created_at,
            ]);

            return response()->json(['data' => $data]);
        } catch (\Throwable $e) {
            Log::error('ProductController@show failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load product.'], 500);
        }
    }

    /**
     * Get sold counts for all products (from actual order data).
     */
    public function soldCounts(): JsonResponse
    {
        try {
            $soldCounts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->whereIn('orders.status', ['DELIVERED', 'PROCESSING'])
                ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
                ->groupBy('order_items.product_id')
                ->get()
                ->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'total_sold' => (int) $item->total_sold,
                ]);

            return response()->json(['data' => $soldCounts]);
        } catch (\Throwable $e) {
            Log::error('ProductController@soldCounts failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load sold counts.'], 500);
        }
    }

    /**
     * Search products (auth-protected).
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = Product::with('category');

            if ($request->filled('q')) {
                $q = $request->q;
                $query->where(function ($query) use ($q) {
                    $query->where('name', 'LIKE', "%{$q}%")
                        ->orWhere('id', 'LIKE', "%{$q}%");
                });
            }

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            $perPage = (int) $request->input('per_page', 20);
            $perPage = max(1, min(100, $perPage));
            $products = $query->paginate($perPage);

            return response()->json([
                'data' => collect($products->items())->map(fn ($p) => $this->formatProduct($p)),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@search failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Search failed.'], 500);
        }
    }

    /**
     * Admin Index: List all products.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['category', 'variants']);

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('id', 'LIKE', "%{$search}%");
                });
            }

            if ($request->filled('category')) {
                $query->where('category_id', $request->category);
            }

            $products = $query->orderBy('id', 'DESC')->get();

            return response()->json([
                'data' => $products->map(function (Product $p) {
                    $data = $this->formatProduct($p);
                    $data['variants'] = $p->variants->map(fn ($v) => [
                        'variant_id' => $v->variant_id,
                        'size' => $v->size,
                        'width' => $v->width,
                        'height' => $v->height,
                        'price' => (float) $v->price,
                        'stock' => (int) $v->stock,
                    ]);

                    return $data;
                }),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@adminIndex failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load products.'], 500);
        }
    }

    /**
     * Admin Show: Get single product.
     */
    public function adminShow(string $id): JsonResponse
    {
        try {
            $product = Product::with('category')->find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            return response()->json(['data' => $this->formatProduct($product)]);
        } catch (\Throwable $e) {
            Log::error('ProductController@adminShow failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load product.'], 500);
        }
    }

    /**
     * Admin Store: Create new product.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'id' => 'nullable|string|max:10|unique:products,id',
                'name' => 'required|string|max:255',
                'category_id' => 'required|string|exists:categories,id',
                'short_description' => 'nullable|string',
                'long_description' => 'nullable|string',
                'best_for' => 'nullable|string|max:500',
                'base_price' => 'required|numeric|min:0',
                'raw_material_cost' => 'nullable|numeric|min:0',
                'min_threshold' => 'nullable|integer|min:0',
                'min_order' => 'nullable|integer|min:1',
                'print_method' => 'nullable|string|max:100',
                'is_in_stock' => 'nullable|in:0,1,true,false',
                'is_need_color' => 'nullable|in:0,1,true,false',
                'ratings' => 'nullable|integer|min:0|max:5',
                'total_sold' => 'nullable|integer|min:0',
                'main_image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
                'gallery' => 'nullable|array',
                'gallery_files' => 'nullable|array',
                'gallery_files.*' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $product = DB::transaction(function () use ($request) {
                $productId = $request->input('id');
                if (! $productId) {
                    $maxNum = DB::select("SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) AS max_num FROM products WHERE id REGEXP '^P[0-9]+$'");
                    $nextNum = ($maxNum[0]->max_num ?? 0) + 1;
                    $productId = 'P'.str_pad($nextNum, 3, '0', STR_PAD_LEFT);
                }
                $mainImageFilename = null;

                if ($request->hasFile('main_image_file')) {
                    $mainImageFilename = $this->storeProductImage(
                        $request->file('main_image_file'),
                        'images/products',
                        $productId.'_main_'.time()
                    );
                }

                $product = Product::create([
                    'id' => $productId,
                    'name' => $request->input('name'),
                    'category_id' => $request->input('category_id'),
                    'short_description' => $request->input('short_description'),
                    'long_description' => $request->input('long_description'),
                    'best_for' => $request->input('best_for'),
                    'base_price' => (float) $request->input('base_price', 0),
                    'raw_material_cost' => (float) $request->input('raw_material_cost', 0),
                    'min_threshold' => (int) $request->input('min_threshold', 0),
                    'min_order' => (int) $request->input('min_order', 1),
                    'print_method' => $request->input('print_method'),
                    'is_in_stock' => filter_var($request->input('is_in_stock', true), FILTER_VALIDATE_BOOLEAN),
                    'is_need_color' => filter_var($request->input('is_need_color', false), FILTER_VALIDATE_BOOLEAN),
                    'ratings' => (int) $request->input('ratings', 5),
                    'total_sold' => (int) $request->input('total_sold', 0),
                    'main_image' => $mainImageFilename,
                ]);

                // Handle gallery images
                $this->handleGalleryImages($request, $product);

                // // Handle variants
                // $this->handleProductVariants($request, $product);

                $this->handleProductVariants($request, $product);
                $this->handleProductTags($request, $product);

                // Increment category count
                DB::table('categories')->where('id', $product->category_id)->increment('count');

                return $product;
            });

            AuditService::created('product', $product->id, ['name' => $product->name]);

            return response()->json(['data' => $this->formatProduct($product)], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => collect($e->errors())->flatten()->first()], 422);
        } catch (\Throwable $e) {
            Log::error('ProductController@store failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to create product.'], 500);
        }
    }

    /**
     * Admin Update: Update existing product.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'category_id' => 'required|string|exists:categories,id',
                'short_description' => 'nullable|string',
                'long_description' => 'nullable|string',
                'best_for' => 'nullable|string|max:500',
                'base_price' => 'required|numeric|min:0',
                'raw_material_cost' => 'nullable|numeric|min:0',
                'min_threshold' => 'nullable|integer|min:0',
                'min_order' => 'nullable|integer|min:1',
                'print_method' => 'nullable|string|max:100',
                'is_in_stock' => 'nullable|in:0,1,true,false',
                'is_need_color' => 'nullable|in:0,1,true,false',
                'ratings' => 'nullable|integer|min:0|max:5',
                'total_sold' => 'nullable|integer|min:0',
                'main_image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            DB::transaction(function () use ($request, $product) {
                if ($request->hasFile('main_image_file')) {
                    if ($product->main_image && File::exists($this->frontendPublicPath('images/products/'.$product->main_image))) {
                        File::delete($this->frontendPublicPath('images/products/'.$product->main_image));
                    }
                    $product->main_image = $this->storeProductImage(
                        $request->file('main_image_file'),
                        'images/products',
                        $product->id.'_main_'.time()
                    );
                }

                $oldCategoryId = $product->category_id;

                $product->update([
                    'name' => $request->input('name'),
                    'category_id' => $request->input('category_id'),
                    'short_description' => $request->input('short_description'),
                    'long_description' => $request->input('long_description'),
                    'best_for' => $request->input('best_for'),
                    'base_price' => (float) $request->input('base_price'),
                    'raw_material_cost' => (float) $request->input('raw_material_cost', 0),
                    'min_threshold' => (int) $request->input('min_threshold', 0),
                    'min_order' => (int) $request->input('min_order', 1),
                    'print_method' => $request->input('print_method'),
                    'is_in_stock' => filter_var($request->input('is_in_stock'), FILTER_VALIDATE_BOOLEAN),
                    'is_need_color' => filter_var($request->input('is_need_color'), FILTER_VALIDATE_BOOLEAN),
                    'ratings' => (int) $request->input('ratings', $product->ratings),
                    'total_sold' => (int) $request->input('total_sold', $product->total_sold),
                ]);

                // Sync category counts if changed
                $newCategoryId = $product->category_id;
                if ($oldCategoryId !== $newCategoryId) {
                    if ($oldCategoryId) {
                        DB::table('categories')
                            ->where('id', $oldCategoryId)
                            ->update(['count' => DB::raw('GREATEST(0, CAST(count AS SIGNED) - 1)')]);
                    }
                    if ($newCategoryId) {
                        DB::table('categories')
                            ->where('id', $newCategoryId)
                            ->increment('count');
                    }
                }

                // Handle gallery images
                $this->handleGalleryImages($request, $product);

                // Handle variants
                $this->handleProductVariants($request, $product);
                $this->handleProductTags($request, $product);
            });

            AuditService::updated('product', $id, [], ['name' => $product->name]);

            return response()->json(['data' => $this->formatProduct($product)]);
        } catch (ValidationException $e) {
            return response()->json(['message' => collect($e->errors())->flatten()->first()], 422);
        } catch (\Throwable $e) {
            Log::error('ProductController@update failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to update product.'], 500);
        }
    }

    /**
     * Get delete info with counts of related records.
     */
    public function deleteInfo(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            return response()->json([
                'data' => [
                    'gallery_count' => ProductGallery::where('product_id', $product->id)->count(),
                    'variants_count' => ProductVariant::where('product_id', $product->id)->count(),
                    'tags_count' => ProductTag::where('product_id', $product->id)->count(),
                    'reviews_count' => ProductReview::where('product_id', $product->id)->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@deleteInfo failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load delete info.'], 500);
        }
    }

    /**
     * Admin Destroy: Delete product.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $mainImage = $product->main_image;

            DB::transaction(function () use ($product) {
                // Delete related gallery images and their files
                $galleryImages = ProductGallery::where('product_id', $product->id)->get();
                foreach ($galleryImages as $img) {
                    $galleryPath = $this->frontendPublicPath('images/products_gallery/'.$img->image_url);
                    if (File::exists($galleryPath)) {
                        File::delete($galleryPath);
                    }
                }
                ProductGallery::where('product_id', $product->id)->delete();

                // Delete related reviews
                ProductReview::where('product_id', $product->id)->delete();

                // Delete related tags
                ProductTag::where('product_id', $product->id)->delete();

                // Delete related variants
                ProductVariant::where('product_id', $product->id)->delete();

                // Decrement category count
                if ($product->category_id) {
                    DB::table('categories')
                        ->where('id', $product->category_id)
                        ->update(['count' => DB::raw('GREATEST(0, CAST(count AS SIGNED) - 1)')]);
                }

                // Delete the product itself
                $product->delete();
            });

            if ($mainImage) {
                $path = $this->frontendPublicPath('images/products/'.$mainImage);
                if (File::exists($path)) {
                    File::delete($path);
                }
            }

            AuditService::deleted('product', $id);

            return response()->json(['message' => 'Product deleted successfully.']);
        } catch (\Throwable $e) {
            Log::error('ProductController@destroy failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to delete product.'], 500);
        }
    }

    /**
     * Get product gallery.
     */
    public function showGallery(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $gallery = $product->gallery()
                ->orderBy('sort_order', 'ASC')
                ->get()
                ->map(fn ($img) => [
                    'id' => $img->id,
                    'image_url' => $img->image_url,
                    'sort_order' => $img->sort_order,
                ]);

            return response()->json(['data' => $gallery]);
        } catch (\Throwable $e) {
            Log::error('ProductController@showGallery failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load gallery.'], 500);
        }
    }

    /**
     * Get product tags.
     */
    public function showTags(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $tags = ProductTag::where('product_id', $product->id)->get();

            return response()->json(['data' => $tags]);
        } catch (\Throwable $e) {
            Log::error('ProductController@showTags failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load tags.'], 500);
        }
    }

    /**
     * Get product variants.
     */
    public function showVariants(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (! $product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            $variants = $product->variants()
                ->get()
                ->map(fn ($v) => [
                    'variant_id' => $v->variant_id,
                    'size' => $v->size,
                    'width' => $v->width,
                    'height' => $v->height,
                    'price' => (float) $v->price,
                    'stock' => (int) $v->stock,
                ]);

            return response()->json(['data' => $variants]);
        } catch (\Throwable $e) {
            Log::error('ProductController@showVariants failed', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to load variants.'], 500);
        }
    }

    /**
     * Helper: Store product image.
     */
    private function storeProductImage(UploadedFile $file, string $directory, string $baseName): string
    {
        $targetPath = $this->frontendPublicPath($directory);
        File::ensureDirectoryExists($targetPath);
        $ext = strtolower($file->getClientOriginalExtension());
        $stem = preg_replace('/[^A-Za-z0-9\-_]/', '-', $baseName);
        $filename = $stem.'.'.$ext;
        $file->move($targetPath, $filename);

        return $filename;
    }

    /**
     * Helper: Handle gallery image uploads and data.
     */
    private function handleGalleryImages(Request $request, Product $product): void
    {
        $galleryData = $request->input('gallery', []);
        $galleryFiles = $request->file('gallery_files', []);

        $imagesToKeep = [];

        foreach ($galleryData as $idx => $item) {
            if (! is_array($item)) {
                continue;
            }

            $sortOrder = (int) ($item['sort_order'] ?? $idx);

            if (isset($item['id']) && $item['id']) {
                $id = $item['id'];
                ProductGallery::where('id', $id)->update(['sort_order' => $sortOrder]);
                $imagesToKeep[] = $id;
            } elseif (isset($galleryFiles[$idx])) {
                $file = $galleryFiles[$idx];
                if ($file) {
                    $filename = $this->storeProductImage(
                        $file,
                        'images/products_gallery',
                        $product->id.'_gallery_'.time().'_'.$idx
                    );

                    $newImage = ProductGallery::create([
                        'product_id' => $product->id,
                        'image_url' => $filename,
                        'sort_order' => $sortOrder,
                    ]);
                    $imagesToKeep[] = $newImage->id;
                }
            }
        }

        $product->gallery()
            ->whereNotIn('id', array_filter($imagesToKeep))
            ->get()
            ->each(function ($img) {
                $path = $this->frontendPublicPath('images/products_gallery/'.$img->image_url);
                if (File::exists($path)) {
                    File::delete($path);
                }
                $img->delete();
            });
    }

    /**
     * Helper: Sync product variants — upsert existing, create new (auto-id), delete removed.
     */
    private function handleProductVariants(Request $request, Product $product): void
    {
        $variantsData = $request->input('variants', []);

        if (! is_array($variantsData)) {
            return;
        }

        $keptVariantIds = [];

        foreach ($variantsData as $idx => $item) {
            if (! is_array($item)) {
                continue;
            }

            if (! empty($item['variant_id'])) {
                // --- Existing variant: update fields ---
                ProductVariant::where('variant_id', $item['variant_id'])
                    ->where('product_id', $product->id)
                    ->update([
                        'size' => $item['size'] ?? null,
                        'width' => $item['width'] ?? null,
                        'height' => $item['height'] ?? null,
                        'price' => (float) ($item['price'] ?? 0),
                        'stock' => (int) ($item['stock'] ?? 0),
                    ]);
                $keptVariantIds[] = $item['variant_id'];
            } else {
                // --- New variant: auto-generate variant_id ---
                $variantId = $product->id.'-V-'.time().$idx;
                ProductVariant::create([
                    'variant_id' => $variantId,
                    'product_id' => $product->id,
                    'size' => $item['size'] ?? null,
                    'width' => $item['width'] ?? null,
                    'height' => $item['height'] ?? null,
                    'price' => (float) ($item['price'] ?? 0),
                    'stock' => (int) ($item['stock'] ?? 0),
                ]);
                $keptVariantIds[] = $variantId;
            }
        }

        // Delete variants that were removed by the user
        ProductVariant::where('product_id', $product->id)
            ->whereNotIn('variant_id', $keptVariantIds)
            ->delete();
    }

    /**
     * Helper: Sync product tags — upsert existing, create new, delete removed.
     */
    private function handleProductTags(Request $request, Product $product): void
    {
        $tagsData = $request->input('tags', []);

        if (! is_array($tagsData)) {
            return;
        }

        $keptTagIds = [];

        foreach ($tagsData as $item) {
            if (! is_array($item)) {
                continue;
            }

            if (! empty($item['id'])) {
                ProductTag::where('id', $item['id'])
                    ->where('product_id', $product->id)
                    ->update(['tag' => $item['tag'] ?? '']);
                $keptTagIds[] = (int) $item['id'];
            } else {
                $tag = ProductTag::create([
                    'product_id' => $product->id,
                    'tag' => $item['tag'] ?? '',
                ]);
                $keptTagIds[] = $tag->id;
            }
        }

        ProductTag::where('product_id', $product->id)
            ->whereNotIn('id', $keptTagIds)
            ->delete();
    }

    private function frontendPublicPath(string $directory = ''): string
    {
        return dirname(base_path()).DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.trim($directory, DIRECTORY_SEPARATOR);
    }

    /**
     * Helper: Format product for response.
     */
    private function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'category_id' => $product->category_id,
            'category_label' => $product->category?->label,
            'short_description' => $product->short_description,
            'long_description' => $product->long_description,
            'best_for' => $product->best_for,
            'base_price' => (float) $product->base_price,
            'raw_material_cost' => (float) $product->raw_material_cost,
            'min_threshold' => (int) $product->min_threshold,
            'min_order' => (int) $product->min_order,
            'main_image' => $product->main_image,
            'print_method' => $product->print_method,
            'is_need_color' => (bool) $product->is_need_color,
            'is_in_stock' => (bool) $product->is_in_stock,
            'ratings' => (float) $product->ratings,
            'total_sold' => (int) $product->total_sold,
        ];
    }
}

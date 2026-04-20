<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $isLoggedIn = Auth::guard('sanctum')->check();

            $query = Product::query()
                ->with([
                    'variants',
                    'tags',
                    'gallery' => fn ($q) => $q->orderBy('sort_order'),
                ])
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->select([
                    'products.id',
                    'products.name',
                    'products.short_description',
                    'products.base_price',
                    'products.current_stock',
                    'products.main_image',
                    'products.ratings',
                    'products.total_sold',
                    'products.min_order',
                    'products.is_need_screenplate',
                    'products.is_need_color',
                    'products.category_id',
                    'categories.label as category_label',
                ]);

            // Filter: Category
            if ($request->filled('category') && $request->category !== 'All') {
                $query->where('categories.label', $request->category);
            }

            // Filter: Search (debounced, min 3 chars)
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('products.name', 'LIKE', "%{$search}%")
                        ->orWhere('products.short_description', 'LIKE', "%{$search}%")
                        ->orWhereHas('tags', function ($t) use ($search) {
                            $t->where('tag', 'LIKE', "%{$search}%");
                        });
                });
            }

            // Filter: Price
            if ($request->filled('price_min')) {
                $query->where('products.base_price', '>=', $request->price_min);
            }
            if ($request->filled('price_max')) {
                $query->where('products.base_price', '<=', $request->price_max);
            }

            // Filter: Ratings
            if ($request->filled('min_rating')) {
                $query->where('products.ratings', '>=', $request->min_rating);
            }

            // Filter: Status
            if ($request->filled('status')) {
                $status = $request->status;
                if ($status === 'In Stock') {
                    $query->where('products.current_stock', '>', 50);
                } elseif ($status === 'Low Stock') {
                    $query->whereBetween('products.current_stock', [1, 50]);
                } elseif ($status === 'Out of Stock') {
                    $query->where('products.current_stock', '<=', 0);
                }
            }

            if ($request->boolean('in_stock_only')) {
                $query->where('products.current_stock', '>', 0);
            }

            // Filter: Screenplate Compatibility (JOIN screenplate_compatibility)
            if ($request->filled('screenplate_id')) {
                $query->whereExists(function ($q) use ($request) {
                    $q->select(DB::raw(1))
                        ->from('screenplate_compatibility')
                        ->whereColumn('screenplate_compatibility.product_id', 'products.id')
                        ->where('screenplate_compatibility.screenplate_id', $request->screenplate_id);
                });
            }

            // Sort Protocols
            $sort = $request->sort;
            $mostSold = $request->boolean('most_sold') || $sort === 'Most Sold';

            if ($mostSold) {
                $query->orderBy(
                    DB::table('order_items')
                        ->join('orders', 'orders.id', '=', 'order_items.order_id')
                        ->whereColumn('order_items.product_id', 'products.id')
                        ->where('orders.status', 'DELIVERED')
                        ->select(DB::raw('SUM(order_items.quantity)')),
                    'DESC'
                )->orderBy('products.id', 'DESC');
            } elseif ($sort === 'Price: Low to High' || $sort === 'Price: Low-High') {
                $query->orderBy('products.base_price', 'ASC');
            } elseif ($sort === 'Price: High to Low' || $sort === 'Price: High-Low') {
                $query->orderBy('products.base_price', 'DESC');
            } elseif ($sort === 'Highest Rating') {
                $query->orderBy('products.ratings', 'DESC');
            } elseif ($sort === 'A to Z') {
                $query->orderBy('products.name', 'ASC');
            } elseif ($sort === 'Z to A') {
                $query->orderBy('products.name', 'DESC');
            } else {
                $query->orderBy('products.id', 'DESC');
            }

            // Wrap in transaction for safe execution
            $paginated = DB::transaction(function () use ($query, $request) {
                return $query->paginate($request->integer('per_page', 20));
            });

            // Post-process to hide base_price for guests and format data
            $paginated->getCollection()->transform(function ($product) use ($isLoggedIn) {
                $data = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'short_description' => $product->short_description,
                    'main_image' => $product->main_image,
                    'ratings' => (float) $product->ratings,
                    'total_sold' => (int) $product->total_sold,
                    'current_stock' => (int) $product->current_stock,
                    'is_need_screenplate' => (bool) $product->is_need_screenplate,
                    'is_need_color' => (bool) $product->is_need_color,
                    'category_id' => $product->category_id,
                    'category_label' => $product->category_label,
                    'min_order' => (int) $product->min_order,
                    'best_for' => $product->best_for,
                    'print_method' => $product->print_method,
                    'tags' => $product->tags->pluck('tag')->toArray(),
                    'variants' => $product->variants->map(fn ($v) => [
                        'variant_id' => $v->variant_id,
                        'label' => $v->label ?? $v->variant_id,
                        'size' => $v->size,
                        'width' => $v->width,
                        'height' => $v->height,
                        'price' => $isLoggedIn ? (float) $v->price : null,
                        'stock' => (int) $v->stock,
                    ])->toArray(),
                    'gallery' => $product->gallery->pluck('image_url')->toArray(),
                ];

                if ($isLoggedIn) {
                    $data['base_price'] = (float) $product->base_price;
                } else {
                    $data['base_price'] = 0; // Or omit/null depending on requirements
                }

                return $data;
            });

            return response()->json($paginated);

        } catch (\Throwable $e) {
            Log::error('ProductController@index failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to load products.',
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $isLoggedIn = Auth::guard('sanctum')->check();

            $product = Product::with([
                'variants',
                'tags',
                'gallery' => fn ($q) => $q->orderBy('sort_order'),
                'category',
            ])->findOrFail($id);

            $data = [
                'id' => $product->id,
                'name' => $product->name,
                'short_description' => $product->short_description,
                'long_description' => $product->long_description,
                'main_image' => $product->main_image,
                'ratings' => (float) $product->ratings,
                'total_sold' => (int) $product->total_sold,
                'current_stock' => (int) $product->current_stock,
                'is_need_screenplate' => (bool) $product->is_need_screenplate,
                'is_need_color' => (bool) $product->is_need_color,
                'category_id' => $product->category_id,
                'category_label' => $product->category->label ?? '',
                'min_order' => (int) $product->min_order,
                'min_threshold' => (int) $product->min_threshold,
                'best_for' => $product->best_for,
                'print_method' => $product->print_method,
                'tags' => $product->tags->pluck('tag')->toArray(),
                'variants' => $product->variants->map(fn ($v) => [
                    'variant_id' => $v->variant_id,
                    'label' => $v->label ?? $v->variant_id,
                    'size' => $v->size,
                    'width' => $v->width,
                    'height' => $v->height,
                    'price' => $isLoggedIn ? (float) $v->price : null,
                    'stock' => (int) $v->stock,
                ])->toArray(),
                'gallery' => $product->gallery->pluck('image_url')->toArray(),
            ];

            if ($isLoggedIn) {
                $data['base_price'] = (float) $product->base_price;
            } else {
                $data['base_price'] = 0;
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@show failed', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Product not found.',
            ], 404);
        }
    }

    public function soldCounts(): JsonResponse
    {
        try {
            $counts = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 'DELIVERED')
                ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
                ->groupBy('order_items.product_id')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $counts,
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductController@soldCounts failed', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to load sold counts.',
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            $searchTerm = $request->query('q');
            $categoryId = $request->query('category_id');

            $results = DB::transaction(function () use ($searchTerm, $categoryId) {
                return Product::select([
                    'products.id',
                    'products.name',
                    'products.base_price',
                    'products.current_stock',
                    'categories.label as category_label',
                    DB::raw('(
                        SELECT image_url FROM product_gallery 
                        WHERE product_id = products.id 
                        AND sort_order = 0 
                        LIMIT 1
                    ) as main_image'),
                ])
                    ->join('categories', 'products.category_id', '=', 'categories.id')
                    ->when($categoryId, fn ($q) => $q->where('products.category_id', $categoryId))
                    ->when($searchTerm, fn ($q) => $q->where(function ($sub) use ($searchTerm) {
                        $sub->where('products.name', 'LIKE', "%{$searchTerm}%")
                            ->orWhere('products.id', 'LIKE', "%{$searchTerm}%")
                            ->orWhere('products.short_description', 'LIKE', "%{$searchTerm}%")
                            ->orWhereHas('tags', fn ($t) => $t->where('tag', 'LIKE', "%{$searchTerm}%"));
                    }))
                    ->orderBy('products.name')
                    ->limit(50)
                    ->get();
            });

            return response()->json(['data' => $results]);
        } catch (\Throwable $e) {
            Log::error('ProductController@search failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Search failed.'], 500);
        }
    }
}

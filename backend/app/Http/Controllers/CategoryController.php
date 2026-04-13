<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     *
     * @return \Illuminate\Http\JsonResponse
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
                'data'   => $categories,
            ]);
        } catch (\Throwable $e) {
            Log::error('CategoryController@index failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Failed to load categories.',
            ], 500);
        }
    }
}

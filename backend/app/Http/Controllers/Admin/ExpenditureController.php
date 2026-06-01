<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenditureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenditures = DB::table('expenditures')->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $expenditures]);
    }

    public function store(Request $request): JsonResponse
    {
        // Implementation
        return response()->json(['message' => 'Created']);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        // Implementation
        return response()->json(['message' => 'Updated']);
    }

    public function destroy(string $id): JsonResponse
    {
        // Implementation
        return response()->json(['message' => 'Deleted']);
    }
}

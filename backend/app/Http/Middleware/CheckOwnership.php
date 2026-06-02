<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckOwnership
{
    public function handle(Request $request, Closure $next, string $table, string $ownerColumn = 'user_id'): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        $resourceId = $request->route('id') ?? $request->route('resourceId');

        if (! $resourceId) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        $resource = DB::table($table)->where('id', $resourceId)->first();

        if (! $resource) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        $ownerId = $resource->{$ownerColumn} ?? null;

        if ($user->role !== 'admin' && $user->role !== 'employee' && $ownerId !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You do not own this resource.',
            ], 403);
        }

        $request->merge(['owned_resource' => $resource]);

        return $next($request);
    }
}

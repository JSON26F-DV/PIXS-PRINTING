<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // For Sanctum, verify token abilities or role
        // A customer has 'role:customer' ability. Employees have abilities matching their roles, e.g. 'role:admin'.
        $hasRole = false;
        foreach ($roles as $role) {
            if ($user->tokenCan("role:{$role}")) {
                $hasRole = true;
                break;
            }
        }

        if (! $hasRole) {
            return response()->json(['message' => 'Forbidden. Insufficient permissions.'], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockBlockedIps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();

        $isBlocked = BlockedIp::active()
            ->where('ip_address', $ip)
            ->exists();

        if ($isBlocked) {
            abort(403, 'Access denied. Your IP address has been blocked.');
        }

        return $next($request);
    }
}

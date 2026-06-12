<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockedIp;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BlockedIpController extends Controller
{
    /**
     * List all blocked IPs.
     */
    public function index()
    {
        $blockedIps = BlockedIp::orderBy('blocked_at', 'desc')->get();

        $temporary = $blockedIps->filter(fn ($ip) => $ip->expires_at !== null);
        $permanent = $blockedIps->filter(fn ($ip) => $ip->expires_at === null);

        return response()->json([
            'status' => 'success',
            'data' => [
                'temporary' => $temporary->values(),
                'permanent' => $permanent->values(),
                'total' => $blockedIps->count(),
                'active_count' => BlockedIp::active()->count(),
            ],
        ]);
    }

    /**
     * Block an IP address.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip_address' => 'required|string|max:45|unique:blocked_ips,ip_address',
            'reason' => 'nullable|string|max:255',
            'duration' => 'nullable|string', // e.g., '1h', '24h', '7d', 'permanent'
        ]);

        $expiresAt = null;
        if (isset($validated['duration']) && $validated['duration'] !== 'permanent') {
            $expiresAt = $this->parseDuration($validated['duration']);
        }

        $blockedIp = BlockedIp::create([
            'ip_address' => $validated['ip_address'],
            'reason' => $validated['reason'],
            'expires_at' => $expiresAt,
            'blocked_at' => now(),
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'IP address blocked successfully.',
            'data' => $blockedIp,
        ]);
    }

    /**
     * Unblock an IP address.
     */
    public function destroy($id)
    {
        $blockedIp = BlockedIp::findOrFail($id);
        $blockedIp->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'IP address unblocked successfully.',
        ]);
    }

    /**
     * Block an IP from audit log.
     */
    public function blockFromAudit(Request $request, $ip)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
            'duration' => 'nullable|string',
        ]);

        $expiresAt = null;
        if (isset($validated['duration']) && $validated['duration'] !== 'permanent') {
            $expiresAt = $this->parseDuration($validated['duration']);
        }

        $blockedIp = BlockedIp::updateOrCreate(
            ['ip_address' => $ip],
            [
                'reason' => $validated['reason'] ?? 'Blocked from audit log',
                'expires_at' => $expiresAt,
                'blocked_at' => now(),
                'is_active' => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => "IP address {$ip} has been blocked.",
            'data' => $blockedIp,
        ]);
    }

    /**
     * Unblock all IPs.
     */
    public function unblockAll()
    {
        BlockedIp::truncate();

        return response()->json([
            'status' => 'success',
            'message' => 'All IP addresses have been unblocked.',
        ]);
    }

    /**
     * Parse duration string to Carbon instance.
     */
    protected function parseDuration(string $duration): ?Carbon
    {
        if (preg_match('/^(\d+)([hdm])$/', $duration, $matches)) {
            $value = (int) $matches[1];
            $unit = $matches[2];

            return match ($unit) {
                'h' => now()->addHours($value),
                'd' => now()->addDays($value),
                'm' => now()->addMonths($value),
                default => null,
            };
        }

        return null;
    }
}

<?php

namespace App\Models;

use Database\Factories\BlockedIpFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    /** @use HasFactory<BlockedIpFactory> */
    use HasFactory;

    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'blocked_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Scope a query to only include active blocked IPs.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}

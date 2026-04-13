<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingPromotion extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'discount_type',
        'discount_value',
        'target_type',
        'assigned_user_id',
        'product_id',
        'code',
        'max_uses',
        'used_count',
        'minimum_quantity',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'discount_value' => 'decimal:2',
    ];
}

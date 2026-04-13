<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerDiscount extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'discount_id',
        'type',
        'value',
        'product_id',
        'remaining_uses',
        'is_one_time',
        'expires_at',
        'status',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}

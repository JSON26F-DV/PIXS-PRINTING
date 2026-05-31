<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    public $timestamps = false;

    protected $table = 'discounts';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'customer_id',
        'product_id',
        'variant_id',
        'code',
        'type',
        'value',
        'min_spend',
        'already_used',
        'expires_at',
    ];

    protected $casts = [
        'already_used' => 'boolean',
        'value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'discount_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'customer_id',
        'product_id',
        'variant_id',
        'screenplate_id',
        'quantity',
        'unit_price',
        'plate_price',
        'total_cart_price',
        'selected',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'plate_price' => 'decimal:2',
        'total_cart_price' => 'decimal:2',
        'selected' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }

    public function screenplate()
    {
        return $this->belongsTo(Screenplate::class);
    }

    public function colors()
    {
        return $this->hasMany(CartItemColor::class, 'cart_item_id');
    }
}

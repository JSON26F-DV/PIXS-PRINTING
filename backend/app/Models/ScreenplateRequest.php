<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScreenplateRequest extends Model
{
    protected $table = 'screenplate_requests';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'customer_id',
        'product_id',
        'variant_id',
        'color_count',
        'alignment',
        'reference_image',
        'comment',
        'calculated_total',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }
}

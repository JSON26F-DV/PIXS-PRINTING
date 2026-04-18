<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScreenplateCompatibility extends Model
{
    protected $table = 'screenplate_compatibility';

    public $timestamps = false;

    protected $fillable = [
        'screenplate_id',
        'product_id',
        'variant_id',
        'print_price_per_unit',
    ];

    protected $casts = [
        'print_price_per_unit' => 'decimal:2',
    ];
}

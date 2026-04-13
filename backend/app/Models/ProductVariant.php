<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'variant_id';
    protected $table = 'product_variants';
}

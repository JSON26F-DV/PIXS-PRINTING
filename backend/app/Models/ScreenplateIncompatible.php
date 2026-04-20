<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScreenplateIncompatible extends Model
{
    protected $table = 'screenplate_incompatible';

    public $timestamps = false;

    protected $fillable = [
        'screenplate_id',
        'product_id',
        'variant_id',
    ];
}

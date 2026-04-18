<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItemColor extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $fillable = [
        'cart_item_id',
        'color_id',
        'channel_label',
        'channel_order',
    ];

    public function color()
    {
        return $this->belongsTo(Color::class);
    }
}

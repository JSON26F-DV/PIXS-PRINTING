<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemColor extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_item_id',
        'color_id',
        'channel_label',
        'channel_order',
    ];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}

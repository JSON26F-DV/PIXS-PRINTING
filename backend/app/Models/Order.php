<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'customer_id',
        'address_id',
        'payment_method_id',
        'discount_id',
        'total_amount',
        'total_discount_amount',
        'status',
        'delivery_method_id',
        'production_notes',
        'feedback',
        'complaint',
        'rating',
        'admin_comment',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function deliveryMethod(): BelongsTo
    {
        return $this->belongsTo(DeliveryMethod::class);
    }
}

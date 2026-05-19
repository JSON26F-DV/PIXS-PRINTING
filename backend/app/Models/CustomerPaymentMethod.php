<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPaymentMethod extends Model
{
    /**
     * The primary key is a string rather than an integer.
     */
    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'id',
        'customer_id',
        'type',
        'bank_name',
        'provider',
        'masked_number',
        'gateway_token',
        'is_default',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Get the customer that owns the payment method.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}

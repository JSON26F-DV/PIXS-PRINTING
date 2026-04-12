<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'customer_id',
        'full_name',
        'phone',
        'region',
        'province',
        'city',
        'barangay',
        'street',
        'address',
        'postal_code',
        'is_default',
        'latitude',
        'longitude',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentCode extends Model
{
    protected $table = 'payment_codes';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'code',
        'is_used',
        'used_at',
        'created_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'payment_code_id', 'id');
    }
}

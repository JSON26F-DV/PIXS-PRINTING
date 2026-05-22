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
        'adress_label',
        'contact_number',
        'region',
        'province',
        'city',
        'barangay',
        'street',
        'postal_code',
        'is_default',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Generate the next custom ID (ADDR-xxx) with a database lock.
     */
    public static function generateNextId(): string
    {
        return \DB::transaction(function () {
            $lastId = self::orderByDesc('id')->lockForUpdate()->value('id');
            $nextNum = $lastId ? (int) substr($lastId, 5) + 1 : 1;

            return 'ADDR-'.str_pad($nextNum, 3, '0', STR_PAD_LEFT);
        });
    }
}

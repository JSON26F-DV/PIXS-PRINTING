<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAddress extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'employee_id',
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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
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

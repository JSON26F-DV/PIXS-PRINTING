<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    // We only have created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'user_id',
        'user_type',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeContactNumber extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'number',
        'is_default',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}

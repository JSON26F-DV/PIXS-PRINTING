<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAttendance extends Model
{
    protected $table = 'employee_attendance';
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'status',
        'overtime',
        'late',
        'hours_worked',
        'total_earnings',
        'holiday_pay',
        'is_paid',
        'holiday_type',
    ];

    protected $casts = [
        'date' => 'date',
        'is_paid' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}

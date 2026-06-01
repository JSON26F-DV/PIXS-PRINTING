<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    use HasFactory;

    protected $table = 'inventory_logs';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'employee_id',
        'product_id',
        'variant_id',
        'expenditure_id',
        'product_name',
        'qty_added',
        'cost',
        'type',
        'notes',
        'date',
    ];

    protected $casts = [
        'qty_added' => 'integer',
        'cost' => 'decimal:2',
        'date' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }

    public function expenditure()
    {
        return $this->belongsTo(Expenditure::class, 'expenditure_id', 'id');
    }
}

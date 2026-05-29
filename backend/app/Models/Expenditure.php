<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expenditure extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'expenditures';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'variant_id',
        'employee_salary_id',
        'category',
        'amount',
        'description',
        'created_at',
    ];

    /**
     * Indicates if the model should be timestamped.
     * Since the table only has created_at, we disable default timestamps 
     * and will manually manage it, or just use UPDATED_AT = null.
     *
     * @var bool
     */
    public $timestamps = false;
    
    // We can also define a boot method to set created_at
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = $model->created_at ?: $model->freshTimestamp();
        });
    }

    /**
     * Get the product variant associated with the expenditure.
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id', 'variant_id');
    }
}

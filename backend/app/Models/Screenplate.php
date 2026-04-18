<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Screenplate extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'owner_id',
        'plate_name',
        'base_setup_fee',
        'is_flatscreen',
        'channels',
        'alignment',
        'supported_alignments',
        'dimensions',
        'technical_info',
        'image',
        'comment',
    ];

    protected $casts = [
        'is_flatscreen' => 'boolean',
        'channels' => 'integer',
        'base_setup_fee' => 'decimal:2',
    ];

    public function owner()
    {
        return $this->belongsTo(Customer::class, 'owner_id');
    }

    public function compatibility()
    {
        return $this->hasMany(ScreenplateCompatibility::class, 'screenplate_id');
    }
}

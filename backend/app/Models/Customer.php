<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * The key type of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'first_name',
        'last_name',
        'email',
        'role',
        'password',
        'google_id',
        'facebook_id',
        'profile_picture',
        'age',
        'gender',
        'company_name',
        'status',
        'date_created',
    ];

    /**
     * Generate the next custom ID (CUST-xxx) with a database lock.
     */
    public static function generateNextId(): string
    {
        return \DB::transaction(function () {
            $lastId = self::orderByDesc('id')->lockForUpdate()->value('id');
            $nextNum = $lastId ? (int) substr($lastId, 5) + 1 : 1;

            return 'CUST-'.str_pad($nextNum, 3, '0', STR_PAD_LEFT);
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
        'facebook_id',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContactNumber::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(CustomerDiscount::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(CustomerPaymentMethod::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}

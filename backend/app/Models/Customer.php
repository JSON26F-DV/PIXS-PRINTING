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
     * Default attribute values for new customers.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'customer',
        'status' => 'active',
    ];

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
        return $this->hasMany(Discount::class, 'customer_id');
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

    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function softDeleteWithRelations(string $deletedBy, string $deletedByType, ?string $reason = null): void
    {
        $deletedAccountData = [
            'original_id' => $this->id,
            'account_type' => 'customer',
            'email' => $this->email,
            'password' => $this->password,
            'deleted_by' => $deletedBy,
            'deleted_by_type' => $deletedByType,
            'reason' => $reason,
            'deleted_at' => now(),
        ];

        \Illuminate\Support\Facades\DB::transaction(function () use ($deletedAccountData) {
            // 1. Save to deleted_accounts
            \App\Models\DeletedAccount::create($deletedAccountData);

            // 2. Delete related tables (cascade should handle this, but explicit delete for safety)
            $this->contacts()->delete();
            $this->addresses()->delete();
            $this->discounts()->delete();


            // 3. Delete customer
            $this->delete();
        });
    }
}


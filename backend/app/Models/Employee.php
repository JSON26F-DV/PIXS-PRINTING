<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class Employee extends Authenticatable
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
     * Default attribute values for new employees.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'company_name' => 'Internal',
        'status' => 'active',
        'role' => 'staff',
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
        'password',
        'role',
        'age',
        'gender',
        'company_name',
        'daily_rate',
        'ot_rate',
        'profile_picture',
        'status',
        'allowed_categories',
        'allowed_products',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
            'allowed_categories' => 'array',
            'allowed_products' => 'array',
        ];
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(EmployeeContactNumber::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(EmployeeAddress::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(EmployeePaymentMethod::class);
    }

    public function softDeleteWithRelations(string $deletedBy, string $deletedByType, ?string $reason = null): void
    {
        $deletedAccountData = [
            'original_id' => $this->id,
            'account_type' => 'employee',
            'email' => $this->email,
            'password' => $this->password,
            'deleted_by' => $deletedBy,
            'deleted_by_type' => $deletedByType,
            'reason' => $reason,
            'deleted_at' => now(),
        ];

        DB::transaction(function () use ($deletedAccountData) {
            // 1. Save to deleted_accounts
            DeletedAccount::create($deletedAccountData);

            // 2. Delete related tables
            $this->contacts()->delete();
            $this->addresses()->delete();
            $this->paymentMethods()->delete();

            // 3. Delete employee
            $this->delete();
        });
    }
}

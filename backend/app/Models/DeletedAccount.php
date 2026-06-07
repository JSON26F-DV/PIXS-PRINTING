<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletedAccount extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'deleted_accounts';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'original_id',
        'account_type',
        'email',
        'password',
        'deleted_by',
        'deleted_by_type',
        'reason',
        'deleted_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    public function restore(): bool
    {
        // Parse email to guess names
        $emailParts = explode('@', $this->email);
        $nameParts = explode('.', $emailParts[0]);
        $firstName = count($nameParts) > 0 ? ucfirst($nameParts[0]) : 'Restored';
        $lastName = count($nameParts) > 1 ? ucfirst($nameParts[1]) : ($this->account_type === 'customer' ? 'Customer' : 'Staff');

        if ($this->account_type === 'customer') {
            $exists = Customer::find($this->original_id);
            if ($exists) {
                return false;
            }

            $customer = new Customer;
            $customer->id = $this->original_id;
            $customer->email = $this->email;
            $customer->password = $this->password;
            $customer->first_name = $firstName;
            $customer->last_name = $lastName;
            $customer->role = 'customer';
            $customer->status = 'active';
            $customer->date_created = now();
            $customer->save();
        } else {
            $exists = Employee::find($this->original_id);
            if ($exists) {
                return false;
            }

            $employee = new Employee;
            $employee->id = $this->original_id;
            $employee->email = $this->email;
            $employee->password = $this->password;
            $employee->first_name = $firstName;
            $employee->last_name = $lastName;
            $employee->company_name = 'Internal';
            $employee->role = 'staff';
            $employee->status = 'active';
            $employee->date_created = now();
            $employee->save();
        }

        $this->delete();

        return true;
    }
}

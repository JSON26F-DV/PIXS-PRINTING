<?php

use App\Models\Customer;
use App\Models\DeletedAccount;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('can soft delete a customer, list it, and purge it', function () {
    // 1. Create Admin Employee
    $admin = new Employee([
        'id' => 'EMP-ADMIN',
        'first_name' => 'Jane',
        'last_name' => 'Admin',
        'email' => 'janeadmin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->company_name = 'Internal';
    $admin->save();

    // 2. Create Customer
    $customer = Customer::create([
        'id' => 'CUST-001',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'janesmith@example.com',
        'password' => bcrypt('password'),
        'status' => 'active',
        'company_name' => 'Customer Co',
    ]);

    // 3. Authenticate Admin
    Sanctum::actingAs($admin, ['role:admin']);

    // 4. Soft Delete Customer (requires password)
    $response = $this->deleteJson("/api/accounts/{$customer->id}/soft-delete", [
        'password' => 'password',
        'reason' => 'Test soft delete reason',
    ]);

    $response->assertStatus(200)
        ->assertJson(['status' => 'success']);

    // Verify Customer record is deleted
    expect(Customer::find('CUST-001'))->toBeNull();

    // Verify DeletedAccount record is created
    $deletedAccount = DeletedAccount::where('original_id', 'CUST-001')->first();
    expect($deletedAccount)->not->toBeNull();
    expect($deletedAccount->email)->toBe('janesmith@example.com');
    expect($deletedAccount->reason)->toBe('Test soft delete reason');

    // 5. List Deleted Accounts
    $listResponse = $this->getJson('/api/accounts/deleted');
    $listResponse->assertStatus(200)
        ->assertJson([
            'status' => 'success',
            'data' => [
                [
                    'original_id' => 'CUST-001',
                    'email' => 'janesmith@example.com',
                ],
            ],
        ]);

    // 6. Purge Customer (requires password)
    $purgeResponse = $this->deleteJson("/api/accounts/deleted/{$deletedAccount->id}/purge", [
        'password' => 'password',
    ]);
    $purgeResponse->assertStatus(200)
        ->assertJson(['status' => 'success']);

    // Verify Customer record is still null
    expect(Customer::find('CUST-001'))->toBeNull();

    // Verify DeletedAccount record is deleted
    expect(DeletedAccount::find($deletedAccount->id))->toBeNull();
});

it('can soft delete an employee, list it, and purge it', function () {
    // 1. Create Admin Employee
    $admin = new Employee([
        'id' => 'EMP-ADMIN',
        'first_name' => 'Jane',
        'last_name' => 'Admin',
        'email' => 'janeadmin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'status' => 'active',
    ]);
    $admin->company_name = 'Internal';
    $admin->save();

    // 2. Create Target Employee
    $target = new Employee([
        'id' => 'EMP-001',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'johndoe@example.com',
        'password' => bcrypt('password'),
        'role' => 'staff',
        'status' => 'active',
    ]);
    $target->company_name = 'Internal';
    $target->save();

    // 3. Authenticate Admin
    Sanctum::actingAs($admin, ['role:admin']);

    // 4. Soft Delete Employee (requires password)
    $response = $this->deleteJson("/api/accounts/{$target->id}/soft-delete", [
        'password' => 'password',
        'reason' => 'Test soft delete reason',
    ]);

    $response->assertStatus(200)
        ->assertJson(['status' => 'success']);

    // Verify Employee record is deleted
    expect(Employee::find('EMP-001'))->toBeNull();

    // Verify DeletedAccount record is created
    $deletedAccount = DeletedAccount::where('original_id', 'EMP-001')->first();
    expect($deletedAccount)->not->toBeNull();
    expect($deletedAccount->email)->toBe('johndoe@example.com');

    // 5. Purge Employee (requires password)
    $purgeResponse = $this->deleteJson("/api/accounts/deleted/{$deletedAccount->id}/purge", [
        'password' => 'password',
    ]);
    $purgeResponse->assertStatus(200)
        ->assertJson(['status' => 'success']);

    // Verify Employee record is still null
    expect(Employee::find('EMP-001'))->toBeNull();

    // Verify DeletedAccount record is deleted
    expect(DeletedAccount::find($deletedAccount->id))->toBeNull();
});

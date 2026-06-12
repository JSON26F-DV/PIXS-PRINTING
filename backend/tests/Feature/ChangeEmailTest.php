<?php

use App\Models\Customer;
use App\Models\Employee;
use App\Services\VerificationCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->verificationService = app(VerificationCodeService::class);
});

test('customer can update email', function () {
    $oldEmail = 'customer@example.com';
    $newEmail = 'new_customer@example.com';

    $customer = Customer::create([
        'id' => 'CUST-001',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => $oldEmail,
        'password' => Hash::make('password123'),
        'company_name' => 'Test Co',
        'status' => 'active',
        'role' => 'customer',
        'date_created' => now(),
    ]);

    $code = $this->verificationService->generateCode($oldEmail, 'change_email');

    $response = $this->postJson('/api/auth/change-email/update', [
        'email' => $oldEmail,
        'code' => $code,
        'new_email' => $newEmail,
    ]);

    $response->assertStatus(200)
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseHas('customers', [
        'id' => 'CUST-001',
        'email' => $newEmail,
    ]);
});

test('employee can update email', function () {
    $oldEmail = 'employee@example.com';
    $newEmail = 'new_employee@example.com';

    // Using DB insert to bypass fillable for testing setup if needed,
    // but better to just provide them if we fix the model.
    // For now, let's use the model but ensure we have all required fields.
    $employee = Employee::create([
        'id' => 'EMP-001',
        'first_name' => 'Jane',
        'last_name' => 'Staff',
        'email' => $oldEmail,
        'password' => Hash::make('password123'),
        'company_name' => 'Test Co',
        'status' => 'active',
        'role' => 'staff',
        'age' => 25,
        'gender' => 'female',
    ]);

    $code = $this->verificationService->generateCode($oldEmail, 'change_email');

    $response = $this->postJson('/api/auth/change-email/update', [
        'email' => $oldEmail,
        'code' => $code,
        'new_email' => $newEmail,
    ]);

    $response->assertStatus(200)
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseHas('employees', [
        'id' => 'EMP-001',
        'email' => $newEmail,
    ]);
});

test('admin cannot update employee email to an existing customer email', function () {
    $customerEmail = 'customer@example.com';
    $employeeEmail = 'employee@example.com';

    Customer::create([
        'id' => 'CUST-001',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => $customerEmail,
        'password' => Hash::make('password123'),
        'company_name' => 'Test Co',
        'status' => 'active',
        'role' => 'customer',
        'date_created' => now(),
    ]);

    $employee = Employee::create([
        'id' => 'EMP-001',
        'first_name' => 'Jane',
        'last_name' => 'Staff',
        'email' => $employeeEmail,
        'password' => Hash::make('password123'),
        'company_name' => 'Test Co',
        'status' => 'active',
        'role' => 'staff',
        'age' => 25,
        'gender' => 'female',
    ]);

    $admin = Employee::create([
        'id' => 'ADM-001',
        'first_name' => 'Admin',
        'last_name' => 'User',
        'email' => 'admin@example.com',
        'password' => Hash::make('password123'),
        'company_name' => 'Admin Co',
        'status' => 'active',
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)
        ->putJson("/api/admin/accounts/employee/{$employee->id}", [
            'first_name' => 'Jane',
            'last_name' => 'Staff',
            'email' => $customerEmail, // Trying to take customer's email
            'role' => 'staff',
            'status' => 'active',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

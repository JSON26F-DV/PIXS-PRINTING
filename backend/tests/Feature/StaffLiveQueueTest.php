<?php

use App\Models\Employee;
use App\Models\Customer;
use App\Models\Order;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('updates the task status and records it in production logs and messages', function () {
    // 1. Create Employee
    $employee = new Employee([
        'id' => 'EMP-1',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'staff',
        'status' => 'active',
    ]);
    $employee->company_name = 'Internal';
    $employee->save();

    // 2. Create Customer
    $customer = Customer::create([
        'id' => 'CUST-1',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'password' => bcrypt('password'),
        'status' => 'active',
        'company_name' => 'Customer Co',
    ]);

    // 3. Create Order
    $order = Order::create([
        'id' => 'ORD-12345',
        'customer_id' => 'CUST-1',
        'total_amount' => 1000.00,
        'status' => 'PENDING',
    ]);

    // 4. Authenticate Employee
    Sanctum::actingAs($employee);

    // 5. Post request to update task status to COMPLETED
    $response = $this->postJson("/api/staff/orders/{$order->id}/task-status", [
        'task_status' => 'COMPLETED',
        'message' => 'Completed successfully',
    ]);

    $response->assertStatus(200)
        ->assertJson(['message' => 'Task status logged and customer notified.']);

    // 6. Verify production logs
    $log = DB::table('production_logs')->where('order_id', $order->id)->first();
    expect($log)->not->toBeNull();
    expect($log->task_status)->toBe('COMPLETED');
    expect($log->employee_id)->toBe($employee->id);

    // 7. Verify message insertion
    $message = DB::table('messages')
        ->where('message_type', 'order')
        ->where('type_id', $order->id)
        ->first();
    expect($message)->not->toBeNull();
    expect($message->sender_id)->toBe($employee->id);
    expect($message->receiver_id)->toBe($customer->id);
    expect($message->product_concern)->toBe(1);
    expect($message->message)->toContain('[LIVE_QUEUE_COMPLETED]');
});

it('validates task status input', function () {
    $employee = new Employee([
        'id' => 'EMP-1',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'password' => bcrypt('password'),
        'role' => 'staff',
        'status' => 'active',
    ]);
    $employee->company_name = 'Internal';
    $employee->save();

    // Create Customer to avoid foreign key failure
    $customer = Customer::create([
        'id' => 'CUST-1',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'password' => bcrypt('password'),
        'status' => 'active',
        'company_name' => 'Customer Co',
    ]);

    $order = Order::create([
        'id' => 'ORD-12345',
        'customer_id' => 'CUST-1',
        'total_amount' => 1000.00,
        'status' => 'PENDING',
    ]);

    Sanctum::actingAs($employee);

    $response = $this->postJson("/api/staff/orders/{$order->id}/task-status", [
        'task_status' => 'INVALID_STATUS',
    ]);

    $response->assertStatus(422);
});

it('returns only explicitly assigned orders in staff live queue for both staff and admin', function () {
    // 1. Create Employees (one staff, one admin)
    $staff = new Employee([
        'id' => 'EMP-STAFF',
        'first_name' => 'John',
        'last_name' => 'Staff',
        'email' => 'johnstaff@example.com',
        'password' => bcrypt('password'),
        'role' => 'staff',
        'status' => 'active',
    ]);
    $staff->company_name = 'Internal';
    $staff->save();

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
    Customer::create([
        'id' => 'CUST-1',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'password' => bcrypt('password'),
        'status' => 'active',
        'company_name' => 'Customer Co',
    ]);

    // 3. Create Orders
    Order::create([
        'id' => 'ORD-ASSIGNED-BOTH',
        'customer_id' => 'CUST-1',
        'total_amount' => 1000.00,
        'status' => 'PENDING',
    ]);
    Order::create([
        'id' => 'ORD-ASSIGNED-STAFF',
        'customer_id' => 'CUST-1',
        'total_amount' => 500.00,
        'status' => 'PENDING',
    ]);
    Order::create([
        'id' => 'ORD-UNASSIGNED',
        'customer_id' => 'CUST-1',
        'total_amount' => 300.00,
        'status' => 'PENDING',
    ]);

    // 4. Assign orders in order_employee_queue
    DB::table('order_employee_queue')->insert([
        ['order_id' => 'ORD-ASSIGNED-BOTH', 'employee_id' => 'EMP-STAFF', 'created_at' => now(), 'updated_at' => now()],
        ['order_id' => 'ORD-ASSIGNED-BOTH', 'employee_id' => 'EMP-ADMIN', 'created_at' => now(), 'updated_at' => now()],
        ['order_id' => 'ORD-ASSIGNED-STAFF', 'employee_id' => 'EMP-STAFF', 'created_at' => now(), 'updated_at' => now()],
    ]);

    // 5. Act as Staff and request live queue
    Sanctum::actingAs($staff);
    $response = $this->getJson('/api/staff/live-queue');
    $response->assertStatus(200);
    $pendingIds = collect($response->json('pending_orders'))->pluck('order_id')->toArray();
    expect($pendingIds)->toContain('ORD-ASSIGNED-BOTH', 'ORD-ASSIGNED-STAFF');
    expect($pendingIds)->not->toContain('ORD-UNASSIGNED');

    // 6. Act as Admin and request live queue
    Sanctum::actingAs($admin);
    $responseAdmin = $this->getJson('/api/staff/live-queue');
    $responseAdmin->assertStatus(200);
    $adminPendingIds = collect($responseAdmin->json('pending_orders'))->pluck('order_id')->toArray();
    // Admin should only see their assigned order, not the unassigned one, nor the staff-only one!
    expect($adminPendingIds)->toContain('ORD-ASSIGNED-BOTH');
    expect($adminPendingIds)->not->toContain('ORD-ASSIGNED-STAFF', 'ORD-UNASSIGNED');
});

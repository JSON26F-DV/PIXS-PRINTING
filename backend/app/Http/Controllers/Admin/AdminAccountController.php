<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\DeletedAccount;
use App\Models\Employee;
use App\Models\EmployeeAddress;
use App\Models\Order;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::all()->map(function ($c) {
            return [
                'id' => $c->id,
                'first_name' => $c->first_name,
                'last_name' => $c->last_name,
                'name' => $c->first_name.' '.$c->last_name,
                'email' => $c->email,
                'profile_picture' => $c->profile_picture,
                'role' => $c->role ?? 'customer',
                'company_name' => $c->company_name,
                'status' => $c->status,
                'type' => 'customer',
                'date_created' => $c->date_created ?? $c->created_at,
            ];
        });

        $employees = Employee::all()->map(function ($e) {
            return [
                'id' => $e->id,
                'first_name' => $e->first_name,
                'last_name' => $e->last_name,
                'name' => $e->first_name.' '.$e->last_name,
                'email' => $e->email,
                'profile_picture' => $e->profile_picture,
                'role' => $e->role ?? 'staff',
                'company_name' => 'Internal',
                'status' => $e->status,
                'type' => 'employee',
                'date_created' => $e->created_at,
                'allowed_categories' => $e->allowed_categories ?? [],
                'allowed_products' => $e->allowed_products ?? [],
            ];
        });

        $accounts = $customers->concat($employees)->sortByDesc('date_created')->values();

        return response()->json([
            'status' => 'success',
            'data' => $accounts,
        ]);
    }

    public function showEmployee($id): JsonResponse
    {
        $employee = Employee::with(['addresses', 'contacts', 'paymentMethods'])->find($id);

        if (! $employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $employee,
        ]);
    }

    public function updateEmployee(Request $request, $id): JsonResponse
    {
        $employee = Employee::find($id);
        $isNew = false;

        if (! $employee) {
            $isNew = true;
            $employee = new Employee;
            // Assign a new ID if it's new (in a real scenario you'd generate a secure ID)
            $employee->id = $id;
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'email', $isNew ? 'unique:employees,email' : Rule::unique('employees')->ignore($employee->id)],
            'role' => 'required|string',
            'status' => 'required|string',
            'daily_rate' => 'nullable|numeric',
            'ot_rate' => 'nullable|numeric',
            'profile_picture' => 'nullable|string',
            'addresses' => 'array',
            'contacts' => 'array',
            'paymentMethods' => 'array',
        ]);

        DB::beginTransaction();
        try {
            $employee->fill($validated);
            if ($request->filled('password')) {
                $employee->password = Hash::make($request->password);
            }
            $employee->save();

            if (isset($validated['addresses'])) {
                $employee->addresses()->delete();
                foreach ($validated['addresses'] as $addr) {
                    if (! isset($addr['id'])) {
                        $addr['id'] = EmployeeAddress::generateNextId();
                    }
                    $employee->addresses()->create($addr);
                }
            }

            if (isset($validated['contacts'])) {
                $employee->contacts()->delete();
                foreach ($validated['contacts'] as $contact) {
                    $employee->contacts()->create($contact);
                }
            }

            if (isset($validated['paymentMethods'])) {
                $employee->paymentMethods()->delete();
                foreach ($validated['paymentMethods'] as $pm) {
                    if (!isset($pm['id']) || empty($pm['id']) || str_starts_with($pm['id'], 'temp_')) {
                        $pm['id'] = 'PAY-' . mt_rand(10000, 99999);
                    }
                    $employee->paymentMethods()->create($pm);
                }
            }

            DB::commit();

            AuditService::log($isNew ? 'create' : 'update', 'employee', $id);

            return response()->json(['status' => 'success', 'data' => $employee->load(['addresses', 'contacts', 'paymentMethods'])]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function showCustomer($id): JsonResponse
    {
        $customer = Customer::with(['addresses', 'contacts', 'paymentMethods'])->find($id);

        if (! $customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $customer,
        ]);
    }

    public function updateCustomer(Request $request, $id): JsonResponse
    {
        $customer = Customer::find($id);
        $isNew = false;

        if (! $customer) {
            $isNew = true;
            $customer = new Customer;
            $customer->id = $id;
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'email', $isNew ? 'unique:customers,email' : Rule::unique('customers')->ignore($customer->id)],
            'role' => 'required|string',
            'status' => 'required|string',
            'age' => 'nullable|integer',
            'gender' => 'nullable|string',
            'company_name' => 'nullable|string',
            'profile_picture' => 'nullable|string',
            'addresses' => 'array',
            'contacts' => 'array',
            'paymentMethods' => 'array',
        ]);

        DB::beginTransaction();
        try {
            $customer->fill($validated);
            if ($request->filled('password')) {
                $customer->password = Hash::make($request->password);
            }
            $customer->save();

            if (isset($validated['addresses'])) {
                $customer->addresses()->delete();
                foreach ($validated['addresses'] as $addr) {
                    if (! isset($addr['id'])) {
                        $addr['id'] = CustomerAddress::generateNextId();
                    }
                    $customer->addresses()->create($addr);
                }
            }

            if (isset($validated['contacts'])) {
                $customer->contacts()->delete();
                foreach ($validated['contacts'] as $contact) {
                    $customer->contacts()->create($contact);
                }
            }

            if (isset($validated['paymentMethods'])) {
                $customer->paymentMethods()->delete();
                foreach ($validated['paymentMethods'] as $pm) {
                    $customer->paymentMethods()->create($pm);
                }
            }

            DB::commit();

            AuditService::log($isNew ? 'create' : 'update', 'customer', $id);

            return response()->json(['status' => 'success', 'data' => $customer->load(['addresses', 'contacts', 'paymentMethods'])]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteAccount(Request $request, $id): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
            'reason' => 'required|string|max:255',
            'type' => 'required|in:employee,customer',
        ]);

        $admin = $request->user();
        if (! Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Authentication failed. Invalid password.'], 403);
        }

        DB::beginTransaction();
        try {
            $target = null;
            if ($request->type === 'employee') {
                $target = Employee::find($id);
            } else {
                $target = Customer::find($id);
            }

            if (! $target) {
                return response()->json(['message' => 'Account not found.'], 404);
            }

            // Create DeletedAccount record
            DeletedAccount::create([
                'original_id' => $target->id,
                'account_type' => $request->type,
                'email' => $target->email,
                'password' => $target->password,
                'reason' => $request->reason,
            ]);

            // Cascading deletion is handled via relationships or explicitly here
            if ($request->type === 'employee') {
                $target->addresses()->delete();
                $target->contacts()->delete();
                $target->paymentMethods()->delete();
                
                DB::table('employee_attendance')->where('employee_id', $id)->delete();
                DB::table('order_employee_queue')->where('employee_id', $id)->delete();
                DB::table('inventory_logs')->where('employee_id', $id)->delete();
                DB::table('production_logs')->where('employee_id', $id)->delete();
                DB::table('refunds')->where('employee_id', $id)->update(['employee_id' => null]);
            } else {
                $target->addresses()->delete();
                $target->contacts()->delete();
                $target->paymentMethods()->delete();
                $target->discounts()->delete();
                
                // Get order IDs to clean up related data in other tables
                $orderIds = DB::table('orders')->where('customer_id', $id)->pluck('id')->toArray();
                
                if (!empty($orderIds)) {
                    DB::table('order_employee_queue')->whereIn('order_id', $orderIds)->delete();
                    DB::table('production_logs')->whereIn('order_id', $orderIds)->delete();
                    DB::table('refunds')->whereIn('order_id', $orderIds)->delete();
                    DB::table('order_items')->whereIn('order_id', $orderIds)->delete();
                    DB::table('orders')->whereIn('id', $orderIds)->delete();
                }
                
                // Clean up any remaining direct references
                DB::table('cart_items')->where('customer_id', $id)->delete();
                DB::table('product_reviews')->where('customer_id', $id)->delete();
                DB::table('notifications')->where('customer_id', $id)->delete();
                DB::table('screenplate_requests')->where('customer_id', $id)->delete();
                DB::table('refunds')->where('customer_id', $id)->delete();
            }

            $target->delete();

            DB::commit();

            AuditService::log('delete', $request->type, $id, ['reason' => $request->reason]);

            return response()->json(['status' => 'success', 'message' => 'Account purged successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function uploadProfilePicture(Request $request): JsonResponse
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
            'id' => 'nullable|string',
        ]);

        $file = $request->file('profile_picture');
        $targetDir = base_path('../frontend/src/assets/profile');

        $id = $request->input('id', 'temp_'.mt_rand(1000, 9999));
        $filename = Str::uuid()->toString().'.'.$file->extension();

        if (! file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $file->move($targetDir, $filename);

        return response()->json([
            'status' => 'success',
            'url' => $filename,
        ]);
    }

    public function updateAssignments(Request $request, $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'allowed_categories' => 'nullable|array',
            'allowed_categories.*' => 'string|max:255',
            'allowed_products' => 'nullable|array',
            'allowed_products.*' => 'string|max:255',
        ]);

        $employee->update([
            'allowed_categories' => $validated['allowed_categories'] ?? [],
            'allowed_products' => $validated['allowed_products'] ?? [],
        ]);

        AuditService::updated('employee_assignments', $id, [], $validated);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $employee->id,
                'allowed_categories' => $employee->allowed_categories,
                'allowed_products' => $employee->allowed_products,
            ],
        ]);
    }

    public function getPendingOrders(Request $request): JsonResponse
    {
        $employeeIds = $request->input('employee_ids', []);
        $category = $request->input('category');
        $orderId = $request->input('order_id');

        $employees = Employee::whereIn('id', $employeeIds)->get();
        $allowedCategories = [];
        foreach ($employees as $employee) {
            $cats = $employee->allowed_categories ?? [];
            $allowedCategories = array_merge($allowedCategories, $cats);
        }
        $allowedCategories = array_unique($allowedCategories);

        $query = Order::query();

        // Show only orders with status == "PENDING"
        $query->where(function ($q) {
            $q->where('status', 'PENDING')->orWhere('status', 'pending');
        });

        if ($orderId) {
            $query->where('id', $orderId);
        } else {
            if ($category && $category !== 'all') {
                $query->whereHas('items.product', function ($q) use ($category) {
                    $q->where('category', $category);
                });
            } else {
                if (! empty($allowedCategories)) {
                    $query->whereHas('items.product', function ($q) use ($allowedCategories) {
                        $q->whereIn('category', $allowedCategories);
                    });
                }
            }
        }

        $orders = $query->with(['items.product'])
            ->latest()
            ->get()
            ->map(fn ($o) => [
                'order_id' => (string) $o->id,
                'user_id' => (string) $o->customer_id,
                'created_at' => $o->created_at->toIso8601String(),
                'total_amount' => (float) $o->total_amount,
                'products' => $o->items->map(fn ($item) => [
                    'productName' => $item->product?->name ?? 'Deleted Product',
                    'category' => $item->product?->category ?? 'General',
                    'quantity' => $item->quantity,
                ])->values(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * Admin preview: return what a specific employee would see in their LiveQueue.
     * GET /api/admin/employees/{id}/live-queue-preview
     */
    public function previewEmployeeLiveQueue(string $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (! $employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $employeeIdStr = (string) $employee->id;

        // Load all PENDING orders
        $allPendingOrders = Order::with([
            'customer', 'items.product', 'items.variant', 'items.colors.colorDetails',
        ])->where('status', 'PENDING')->latest()->get();

        // Load queue assignments
        $queueRows = DB::table('order_employee_queue')
            ->get(['order_id', 'employee_id']);
        $queueMap = [];
        foreach ($queueRows as $row) {
            $queueMap[(string) $row->order_id][] = (string) $row->employee_id;
        }

        $productionLogMap = DB::table('production_logs')
            ->get()->keyBy('order_id');

        $pendingOrders = [];
        $productionOrders = [];

        foreach ($allPendingOrders as $o) {
            $orderId = (string) $o->id;

            // Employee MUST be explicitly assigned to see the order in their live queue.
            if (! isset($queueMap[$orderId]) || ! in_array($employeeIdStr, $queueMap[$orderId], true)) {
                continue;
            }

            $formattedOrder = [
                'order_id' => $orderId,
                'user_id' => $o->customer ? "{$o->customer->first_name} {$o->customer->last_name}" : (string) $o->customer_id,
                'company_name' => $o->customer ? $o->customer->company_name : null,
                'customer_id' => (string) $o->customer_id,
                'total_amount' => (float) $o->total_amount,
                'status' => $o->status,
                'created_at' => $o->created_at->toIso8601String(),
                'products' => $o->items->map(fn ($item) => [
                    'id' => $item->id,
                    'order_id' => $item->order_id,
                    'customer_id' => $item->customer_id,
                    'productId' => $item->product_id,
                    'productName' => $item->product?->name ?? 'Deleted Product',
                    'productImage' => $item->product && $item->product->main_image
                        ? '/images/products/'.$item->product->main_image : '',
                    'category' => $item->product?->category?->label ?? 'General',
                    'quantity' => $item->quantity,
                    'variant' => [
                        'id' => $item->variant_id,
                        'size' => $item->variant?->size ?? 'N/A',
                        'unitPrice' => (float) $item->unit_price,
                    ],
                    'colors' => $item->colors->map(fn ($c) => [
                        'name' => $c->colorDetails?->name ?? 'Unknown',
                        'hex' => $c->colorDetails?->hex ?? '#000000',
                    ]),
                    'plate' => $item->screenplate ? [
                        'id' => $item->screenplate->id,
                        'name' => $item->screenplate->name,
                        'setupFee' => (float) $item->screenplate->setup_fee,
                        'printPricePerUnit' => (float) $item->plate_price,
                    ] : null,
                    'customRequirements' => $o->production_notes,
                ])->toArray(),
            ];

            if ($productionLogMap->has($o->id)) {
                $log = $productionLogMap->get($o->id);
                $formattedOrder['task_status'] = $log->task_status;
                $formattedOrder['requested_at'] = $log->requested_at;
                $productionOrders[] = $formattedOrder;
            } else {
                $pendingOrders[] = $formattedOrder;
            }
        }

        return response()->json([
            'pending_orders' => $pendingOrders,
            'production_orders' => $productionOrders,
        ]);
    }
}

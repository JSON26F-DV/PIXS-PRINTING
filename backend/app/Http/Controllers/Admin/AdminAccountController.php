<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\DeletedAccount;
use App\Models\Employee;
use App\Models\EmployeeAddress;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        $employee = Employee::with(['addresses', 'contacts'])->find($id);

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

            DB::commit();

            AuditService::log($isNew ? 'create' : 'update', 'employee', $id);

            return response()->json(['status' => 'success', 'data' => $employee->load(['addresses', 'contacts'])]);
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
                // other relationships
            } else {
                $target->addresses()->delete();
                $target->contacts()->delete();
                $target->paymentMethods()->delete();
                $target->discounts()->delete();
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
        $filename = 'profile_'.$id.'_'.time().'.'.$file->getClientOriginalExtension();

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
}

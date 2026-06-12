<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Employee;
use App\Models\EmployeeAddress;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof Customer) {
            $user->load(['contacts', 'addresses', 'discounts']);

            return response()->json([
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->first_name.' '.$user->last_name,
                'email' => $user->email,
                'profile_picture' => $user->profile_picture,
                'age' => $user->age,
                'gender' => $user->gender,
                'company_name' => $user->company_name,
                'status' => $user->status,
                'role' => $user->role ?? 'customer',
                'total_orders_value' => (float) $user->total_orders_value,
                'orders' => (int) $user->orders,
                'contacts' => $user->contacts,
                'addresses' => $user->addresses,
                'discounts' => $user->discounts,
                'type' => 'customer',
            ]);
        } elseif ($user instanceof Employee) {
            $user->load(['contacts', 'addresses']);

            return response()->json([
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->first_name.' '.$user->last_name,
                'email' => $user->email,
                'profile_picture' => $user->profile_picture,
                'role' => $user->role,
                'status' => $user->status,
                'daily_rate' => (float) $user->daily_rate,
                'ot_rate' => (float) $user->ot_rate,
                'contacts' => $user->contacts,
                'addresses' => $user->addresses->map(function ($addr) {
                    return [
                        'id' => $addr->id,
                        'adress_label' => $addr->full_name, // Map for UI consistency
                        'contact_number' => $addr->phone,    // Map for UI consistency
                        'region' => $addr->region,
                        'province' => $addr->province,
                        'city' => $addr->city,
                        'barangay' => $addr->barangay,
                        'street' => $addr->street,
                        'postal_code' => $addr->postal_code,
                        'is_default' => (bool) $addr->is_default,
                    ];
                }),
                'type' => 'employee',
                'company_name' => 'Internal',
            ]);
        }

        return response()->json(['message' => 'User not found'], 404);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:255'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'gender' => ['nullable', 'in:male,female,other'],
            'company_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        AuditService::updated($user instanceof Customer ? 'customer_profile' : 'employee_profile', $user->id, [], $validated);

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
    }

    public function updateProfilePicture(Request $request): JsonResponse
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $user = $request->user();
        $file = $request->file('profile_picture');

        $targetDir = base_path('../frontend/src/assets/profile');

        if ($user->profile_picture) {
            $oldPath = $targetDir.'/'.$user->profile_picture;
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $filename = Str::uuid()->toString().'.'.$file->extension();

        if (! file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $file->move($targetDir, $filename);

        $user->update(['profile_picture' => $filename]);

        AuditService::updated($user instanceof Customer ? 'customer_profile' : 'employee_profile', $user->id, [], ['profile_picture' => $filename]);

        return response()->json([
            'message' => 'Profile picture updated',
            'url' => $filename,
        ]);
    }

    public function addresses(Request $request): JsonResponse
    {
        $user = $request->user();
        $addresses = $user->addresses;

        if ($user instanceof Employee) {
            $addresses = $addresses->map(function ($addr) {
                return [
                    'id' => $addr->id,
                    'adress_label' => $addr->full_name,
                    'contact_number' => $addr->phone,
                    'region' => $addr->region,
                    'province' => $addr->province,
                    'city' => $addr->city,
                    'barangay' => $addr->barangay,
                    'street' => $addr->street,
                    'postal_code' => $addr->postal_code,
                    'is_default' => (bool) $addr->is_default,
                ];
            });
        }

        return response()->json([
            'data' => $addresses,
        ]);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'adress_label' => 'nullable|string',
            'contact_number' => 'required|string',
            'street' => 'required|string',
            'region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'barangay' => 'nullable|string',
            'postal_code' => 'nullable|string',
        ]);

        if ($user instanceof Customer) {
            $payload = [
                'id' => CustomerAddress::generateNextId(),
                'adress_label' => $validated['adress_label'],
                'contact_number' => $validated['contact_number'],
                'street' => $validated['street'],
                'region' => $validated['region'],
                'province' => $validated['province'],
                'city' => $validated['city'],
                'barangay' => $validated['barangay'],
                'postal_code' => $validated['postal_code'],
                'is_default' => $user->addresses()->count() === 0,
            ];
            $address = $user->addresses()->create($payload);
        } else {
            $payload = [
                'id' => EmployeeAddress::generateNextId(),
                'full_name' => $validated['adress_label'] ?? 'Work',
                'phone' => $validated['contact_number'],
                'street' => $validated['street'],
                'region' => $validated['region'],
                'province' => $validated['province'],
                'city' => $validated['city'],
                'barangay' => $validated['barangay'],
                'postal_code' => $validated['postal_code'],
                'is_default' => $user->addresses()->count() === 0,
            ];
            $address = $user->addresses()->create($payload);
        }

        return response()->json([
            'message' => 'Address added successfully',
            'data' => $address,
        ]);
    }

    public function updateAddress(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->findOrFail($id);

        $validated = $request->validate([
            'adress_label' => 'sometimes|string',
            'contact_number' => 'sometimes|string',
            'street' => 'sometimes|string',
            'region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'barangay' => 'nullable|string',
            'postal_code' => 'nullable|string',
        ]);

        if ($user instanceof Customer) {
            $address->update($validated);
        } else {
            $payload = [
                'full_name' => $validated['adress_label'] ?? $address->full_name,
                'phone' => $validated['contact_number'] ?? $address->phone,
                'street' => $validated['street'] ?? $address->street,
                'region' => $validated['region'] ?? $address->region,
                'province' => $validated['province'] ?? $address->province,
                'city' => $validated['city'] ?? $address->city,
                'barangay' => $validated['barangay'] ?? $address->barangay,
                'postal_code' => $validated['postal_code'] ?? $address->postal_code,
            ];
            $address->update($payload);
        }

        return response()->json([
            'message' => 'Address updated successfully',
            'data' => $address,
        ]);
    }

    public function deleteAddress(Request $request, string $id): JsonResponse
    {
        $request->user()->addresses()->where('id', $id)->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }

    public function setDefaultAddress(Request $request, string $id): JsonResponse
    {
        $request->user()->addresses()->update(['is_default' => false]);
        $request->user()->addresses()->where('id', $id)->update(['is_default' => true]);

        return response()->json(['message' => 'Default address updated']);
    }

    public function storeContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'number' => 'required|string|max:30',
        ]);

        $contact = $request->user()->contacts()->create([
            'number' => $validated['number'],
            'is_default' => $request->user()->contacts()->count() === 0,
        ]);

        return response()->json([
            'message' => 'Contact added successfully',
            'data' => $contact,
        ]);
    }

    public function setDefaultContact(Request $request, string $number): JsonResponse
    {
        $request->user()->contacts()->update(['is_default' => false]);
        $request->user()->contacts()->where('number', $number)->update(['is_default' => true]);

        return response()->json(['message' => 'Default contact updated']);
    }

    public function deleteContact(Request $request, string $number): JsonResponse
    {
        $user = $request->user();
        $contact = $user->contacts()->where('number', $number)->first();
        if (!$contact) {
            return response()->json(['message' => 'Contact not found'], 404);
        }

        $wasDefault = $contact->is_default;
        $contact->delete();

        if ($wasDefault) {
            $next = $user->contacts()->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Contact deleted successfully']);
    }
}

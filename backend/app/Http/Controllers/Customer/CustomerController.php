<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Discount;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    /**
     * Get the authenticated customer profile.
     */
    public function profile(Request $request): JsonResponse
    {
        $customer = $request->user();

        // Ensure we're dealing with a Customer model
        if (! $customer instanceof Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Load relationships
        $customer->load(['contacts', 'addresses', 'discounts']);

        return response()->json([
            'id' => $customer->id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => $customer->first_name.' '.$customer->last_name,
            'email' => $customer->email,
            'profile_picture' => $customer->profile_picture,
            'age' => $customer->age,
            'gender' => $customer->gender,
            'company_name' => $customer->company_name,
            'status' => $customer->status,
            'total_orders_value' => (float) $customer->total_orders_value,
            'orders' => (int) $customer->orders,
            'contacts' => $customer->contacts,
            'addresses' => $customer->addresses,
            'discounts' => $customer->discounts,
        ]);
    }

    /**
     * Update profile basic info.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $customer = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'gender' => ['nullable', 'in:male,female,other'],
            'company_name' => ['nullable', 'string', 'max:255'],
        ]);

        $customer->update($validated);

        AuditService::updated('customer_profile', $customer->id, [], $validated);

        return response()->json(['message' => 'Profile updated successfully', 'user' => $customer]);
    }

    /**
     * Get customer addresses.
     */
    public function addresses(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->addresses,
        ]);
    }

    /**
     * Store new address.
     */
    public function storeAddress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'adress_label' => 'nullable|string',
            'contact_number' => 'required|string',
            'street' => 'required|string',
            'region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'barangay' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'regionCode' => 'nullable|string',
            'provinceCode' => 'nullable|string',
            'municipalityCode' => 'nullable|string',
            'barangayCode' => 'nullable|string',
        ]);

        $validated['id'] = CustomerAddress::generateNextId();
        $validated['is_default'] = $request->user()->addresses()->count() === 0;

        $address = $request->user()->addresses()->create($validated);

        AuditService::created('customer_address', $address->id, ['customer_id' => $request->user()->id]);

        return response()->json([
            'message' => 'Address added successfully',
            'data' => $address,
        ]);
    }

    /**
     * Update existing address.
     */
    public function updateAddress(Request $request, string $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        $validated = $request->validate([
            'adress_label' => 'sometimes|string',
            'contact_number' => 'sometimes|string',
            'street' => 'sometimes|string',
            'region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'barangay' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'regionCode' => 'nullable|string',
            'provinceCode' => 'nullable|string',
            'municipalityCode' => 'nullable|string',
            'barangayCode' => 'nullable|string',
        ]);

        $address->update($validated);

        AuditService::updated('customer_address', $id, [], $validated);

        return response()->json([
            'message' => 'Address updated successfully',
            'data' => $address,
        ]);
    }

    /**
     * Delete address.
     */
    public function deleteAddress(Request $request, string $id): JsonResponse
    {
        $request->user()->addresses()->where('id', $id)->delete();

        AuditService::deleted('customer_address', $id);

        return response()->json(['message' => 'Address deleted successfully']);
    }

    /**
     * Set default address.
     */
    public function setDefaultAddress(Request $request, string $id): JsonResponse
    {
        $request->user()->addresses()->update(['is_default' => false]);
        $request->user()->addresses()->where('id', $id)->update(['is_default' => true]);

        return response()->json(['message' => 'Default address updated']);
    }

    /**
     * Get available promotions for the customer.
     */
    public function promotions(Request $request): JsonResponse
    {
        $customer = $request->user();

        $discounts = Discount::whereNotNull('code')
            ->where('code', '!=', '')
            ->where('customer_id', $customer->id)
            ->get();

        $mapped = $discounts->map(function ($discount) {
            $status = 'active';
            if ($discount->already_used) {
                $status = 'used';
            } elseif ($discount->expires_at && $discount->expires_at->isPast()) {
                $status = 'expired';
            }

            return [
                'id' => $discount->id,
                'code' => $discount->code,
                'title' => $discount->title ?? ("Campaign " . ($discount->code ?? $discount->id)),
                'discount_type' => $discount->type === 'percentage' ? 'percentage' : 'fixed',
                'discount_value' => (float) $discount->value,
                'product_id' => $discount->product_id,
                'expires_at' => $discount->expires_at ? $discount->expires_at->toIso8601String() : null,
                'status' => $status,
                'target_type' => 'specific_user',
                'assigned_user_id' => $discount->customer_id,
            ];
        });

        return response()->json([
            'data' => $mapped,
        ]);
    }

    /**
     * Redeem a promotion code.
     */
    public function redeemPromotion(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $promotion = Discount::where('code', strtoupper($request->code))
            ->whereColumn('customer_id', 'code')
            ->first();

        if (! $promotion) {
            return response()->json(['message' => 'Invalid or already used promotion code'], 422);
        }

        if ($promotion->expires_at && $promotion->expires_at->isPast()) {
            return response()->json(['message' => 'This promotion code has expired'], 422);
        }

        $userId = $request->user()->id;

        $promotion->update([
            'customer_id' => $userId,
            'already_used' => false,
        ]);

        AuditService::updated('discount', $promotion->id, [], ['redeemed_by' => $userId]);

        $fresh = $promotion->fresh();

        return response()->json([
            'message' => 'Promotion code applied successfully',
            'data' => [
                'id' => $fresh->id,
                'code' => $fresh->code,
                'title' => $fresh->title ?? ("Campaign " . ($fresh->code ?? $fresh->id)),
                'discount_type' => $fresh->type === 'percentage' ? 'percentage' : 'fixed',
                'discount_value' => (float) $fresh->value,
                'product_id' => $fresh->product_id,
                'expires_at' => $fresh->expires_at ? $fresh->expires_at->toIso8601String() : null,
                'status' => 'active',
                'target_type' => 'specific_user',
                'assigned_user_id' => $fresh->customer_id,
            ],
        ]);
    }

    /**
     * Store new contact.
     */
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

    /**
     * Delete contact.
     */
    public function deleteContact(Request $request, string $number): JsonResponse
    {
        $user = $request->user();
        $contact = $user->contacts()->where('number', $number)->first();
        if (! $contact) {
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

    /**
     * Update profile picture.
     * Saves file to frontend assets and stores only the filename in DB.
     * Deletes the old picture from filesystem before saving the new one.
     */
    public function updateProfilePicture(Request $request): JsonResponse
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $customer = $request->user();
        $file = $request->file('profile_picture');

        // Delete old picture from filesystem if it exists
        $targetDir = base_path('../frontend/src/assets/profile');
        if ($customer->profile_picture) {
            $oldPath = $targetDir.'/'.$customer->profile_picture;
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $filename = Str::uuid()->toString().'.'.$file->extension();

        if (! file_exists($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $file->move($targetDir, $filename);

        // Store only the filename in the database as requested
        $customer->update(['profile_picture' => $filename]);

        AuditService::updated('customer_profile', $customer->id, [], ['profile_picture' => $filename]);

        return response()->json([
            'message' => 'Profile picture updated',
            'url' => $filename,
        ]);
    }
}

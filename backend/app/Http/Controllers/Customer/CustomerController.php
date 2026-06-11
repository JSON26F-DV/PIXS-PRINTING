<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\MarketingPromotion;
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

        $promotions = MarketingPromotion::where('status', 'active')
            ->where(function ($query) use ($customer) {
                $query->where('target_type', 'all_users')
                    ->orWhere('assigned_user_id', $customer->id);
            })
            ->where('expires_at', '>', now())
            ->get();

        return response()->json([
            'data' => $promotions,
        ]);
    }

    /**
     * Redeem a promotion code.
     */
    public function redeemPromotion(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $promotion = MarketingPromotion::where('code', $request->code)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->first();

        if (! $promotion) {
            return response()->json(['message' => 'Invalid or expired promotion code'], 422);
        }

        if ($promotion->max_uses && $promotion->used_count >= $promotion->max_uses) {
            return response()->json(['message' => 'Promotion code has reached its usage limit'], 422);
        }

        if ($promotion->target_type === 'specific_user' && $promotion->assigned_user_id !== $request->user()->id) {
            return response()->json(['message' => 'This promotion is not available for your account'], 403);
        }

        // Normally we'd track usage here or on order checkout
        // For simulation, we return success
        return response()->json([
            'message' => 'Promotion code applied successfully',
            'data' => $promotion,
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

    /**
     * Set default contact.
     */
    public function setDefaultContact(Request $request, string $number): JsonResponse
    {
        $request->user()->contacts()->update(['is_default' => false]);
        $request->user()->contacts()->where('number', $number)->update(['is_default' => true]);

        return response()->json(['message' => 'Default contact updated']);
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

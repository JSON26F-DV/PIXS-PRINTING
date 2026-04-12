<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Get the authenticated customer profile.
     */
    public function profile(Request $request): JsonResponse
    {
        $customer = $request->user();

        // Ensure we're dealing with a Customer model
        if (!$customer instanceof \App\Models\Customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Load relationships
        $customer->load(['contacts', 'addresses']);

        return response()->json([
            'id' => $customer->id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => $customer->first_name . ' ' . $customer->last_name,
            'email' => $customer->email,
            'profile_picture' => $customer->profile_picture,
            'age' => $customer->age,
            'gender' => $customer->gender,
            'company_name' => $customer->company_name,
            'status' => $customer->status,
            'contacts' => $customer->contacts,
            'addresses' => $customer->addresses,
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

        return response()->json(['message' => 'Profile updated successfully', 'user' => $customer]);
    }
}

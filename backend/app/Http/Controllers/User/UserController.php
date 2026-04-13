<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $customerId = $request->user()->id;

        $customer = Customer::where('id', $customerId)->first();

        if (! $customer) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $defaultContact = \DB::table('customer_contact_numbers')
            ->where('customer_id', $customerId)
            ->where('is_default', true)
            ->first();

        $contacts = \DB::table('customer_contact_numbers')
            ->where('customer_id', $customerId)
            ->get();

        return response()->json([
            'id' => $customer->id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'name' => $customer->first_name.' '.$customer->last_name,
            'email' => $customer->email,
            'profile_picture' => $customer->profile_picture,
            'default_contact' => $defaultContact ? $defaultContact->number : null,
            'contacts' => $contacts->map(function ($c) {
                return [
                    'number' => $c->number,
                    'is_default' => $c->is_default,
                ];
            }),
        ]);
    }
}

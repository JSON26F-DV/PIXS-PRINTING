<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::orderBy('first_name');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $customers = $query->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->first_name.' '.$c->last_name,
            'first_name' => $c->first_name,
            'last_name' => $c->last_name,
            'email' => $c->email,
            'profile_picture' => $c->profile_picture,
            'role' => $c->role,
            'company_name' => $c->company_name,
            'status' => $c->status,
            'orders' => $c->orders,
            'total_orders_value' => (float) $c->total_orders_value,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $customers,
        ]);
    }
}

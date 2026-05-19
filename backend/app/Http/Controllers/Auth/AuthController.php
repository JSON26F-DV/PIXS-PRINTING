<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DeletedAccount;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    /**
     * Handle login for both employees and customers.
     * Order: deleted_accounts → customers → employees
     *
     * All passwords use Bcrypt via Hash::check() — no legacy SHA-256.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Rate limit: 5 attempts per minute per IP
        $key = 'login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => "Too many login attempts. Try again in {$seconds} seconds.",
            ], 429);
        }

        // ── Step 1: Check deleted/banned accounts ──────────────────
        $banned = DeletedAccount::where('email', $request->email)->first();

        if ($banned && Hash::check($request->password, $banned->password)) {
            RateLimiter::clear($key);

            return response()->json([
                'banned' => true,
                'original_id' => $banned->original_id,
                'account_type' => $banned->account_type,
                'email' => $banned->email,
                'reason' => $banned->reason,
                'deleted_at' => $banned->deleted_at,
            ], 403);
        }

        // ── Step 2: Check customers table ──────────────────────────
        $customer = Customer::where('email', $request->email)->first();

        if ($customer && Hash::check($request->password, $customer->password)) {
            RateLimiter::clear($key);

            // Rehash if bcrypt cost has been updated
            if (Hash::needsRehash($customer->password)) {
                $customer->update(['password' => Hash::make($request->password)]);
            }

            // Revoke old tokens, issue new one (30-day expiry)
            $customer->tokens()->delete();
            $token = $customer->createToken(
                'customer-token',
                ['role:customer'],
                now()->addDays(30)
            )->plainTextToken;

            return response()->json([
                'token' => $token,
                'account_type' => 'customer',
                'expires_at' => now()->addDays(30)->toISOString(),
                'user' => [
                    'id' => $customer->id,
                    'email' => $customer->email,
                    'first_name' => $customer->first_name,
                    'last_name' => $customer->last_name,
                    'role' => $customer->role ?? 'customer',
                    'profile_picture' => $customer->profile_picture,
                    'status' => $customer->status,
                    'age' => $customer->age,
                    'gender' => $customer->gender,
                    'company_name' => $customer->company_name,
                ],
            ]);
        }

        // ── Step 3: Check employees table ──────────────────────────
        $employee = Employee::where('email', $request->email)->first();

        if ($employee && Hash::check($request->password, $employee->password)) {
            RateLimiter::clear($key);

            // Rehash if bcrypt cost has been updated
            if (Hash::needsRehash($employee->password)) {
                $employee->update(['password' => Hash::make($request->password)]);
            }

            // Revoke old tokens, issue new one (8-hour expiry)
            $employee->tokens()->delete();
            $token = $employee->createToken(
                'employee-token',
                ['role:'.$employee->role],
                now()->addHours(8)
            )->plainTextToken;

            return response()->json([
                'token' => $token,
                'account_type' => 'employee',
                'expires_at' => now()->addHours(8)->toISOString(),
                'user' => [
                    'id' => $employee->id,
                    'email' => $employee->email,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'role' => $employee->role,
                    'profile_picture' => $employee->profile_picture,
                    'status' => $employee->status,
                    'age' => $employee->age,
                    'gender' => $employee->gender,
                    'company_name' => $employee->company_name,
                ],
            ]);
        }

        // ── No match found ─────────────────────────────────────────
        RateLimiter::hit($key, 60);

        return response()->json([
            'message' => 'Invalid email or password.',
        ], 401);
    }

    /**
     * Revoke current Sanctum token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Return the currently authenticated user.
     * Works for both employees and customers via Sanctum.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $accountType = $user instanceof Employee ? 'employee' : 'customer';
        $role = $user->role ?? ($accountType === 'customer' ? 'customer' : 'staff');

        return response()->json([
            'account_type' => $accountType,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $role,
                'profile_picture' => $user->profile_picture,
                'status' => $user->status,
                'age' => $user->age,
                'gender' => $user->gender,
                'company_name' => $user->company_name,
            ],
        ]);
    }
}

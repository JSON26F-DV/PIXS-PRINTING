<?php
// app/Http/Controllers/Auth/RegisterController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DeletedAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;

class RegisterController extends Controller
{
    /**
     * Register a new customer account.
     * Only customers self-register — employees are created by admin.
     */
    public function register(Request $request): JsonResponse
    {
        // Rate limit: 3 registration attempts per minute per IP
        $key = 'register:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Too many attempts. Try again in {$seconds} seconds.",
            ], 429);
        }

        // ── Validate input ─────────────────────────────────────────
        $request->validate([
            'first_name'   => ['required', 'string', 'max:100'],
            'last_name'    => ['required', 'string', 'max:100'],
            'email'        => ['required', 'email', 'max:255'],
            'password'     => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->numbers()
                    ->symbols(),
            ],
            'age'          => ['nullable', 'integer', 'min:1', 'max:120'],
            'gender'       => ['nullable', 'in:male,female,other'],
            'company_name' => ['nullable', 'string', 'max:255'],
        ]);

        // ── Check banned email ─────────────────────────────────────
        $banned = DeletedAccount::where('email', $request->email)->first();
        if ($banned) {
            RateLimiter::hit($key, 60);
            return response()->json([
                'banned'     => true,
                'message'    => 'This email is associated with a banned account.',
                'reason'     => $banned->reason,
                'deleted_at' => $banned->deleted_at,
            ], 403);
        }

        // ── Check duplicate email ──────────────────────────────────
        if (Customer::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => ['email' => ['The email has already been taken.']],
            ], 422);
        }

        // ── Create customer inside a DB transaction ────────────────
        // Transaction + lock prevents race condition on ID generation
        $customer = DB::transaction(function () use ($request) {
            // Lock the table row to prevent duplicate CUST-xxx IDs
            $lastId  = Customer::lockForUpdate()->orderByDesc('id')->value('id');
            $nextNum = $lastId ? ((int) substr($lastId, 5)) + 1 : 1;
            $newId   = 'CUST-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

            return Customer::create([
                'id'           => $newId,
                'first_name'   => $request->first_name,
                'last_name'    => $request->last_name,
                'email'        => $request->email,
                'role'         => 'customer',
                'password'     => Hash::make($request->password), // bcrypt always
                'age'          => $request->age,
                'gender'       => $request->gender,
                'company_name' => $request->company_name,
                'status'       => 'active',
                'date_created' => now(),
            ]);
        });

        RateLimiter::clear($key);

        // ── Issue Sanctum token (30-day expiry) ────────────────────
        $token = $customer->createToken(
            'customer-token',
            ['role:customer'],
            now()->addDays(30)
        )->plainTextToken;

        return response()->json([
            'token'        => $token,
            'account_type' => 'customer',
            'expires_at'   => now()->addDays(30)->toISOString(),
            'user'         => [
                'id'              => $customer->id,
                'email'           => $customer->email,
                'first_name'      => $customer->first_name,
                'last_name'       => $customer->last_name,
                'role'            => $customer->role,
                'profile_picture' => null,
                'status'          => 'active',
            ],
        ], 201);
    }

    /**
     * Redirect to social provider.
     */
    public function redirectToProvider(string $provider)
    {
        if (! in_array($provider, ['google', 'facebook'])) {
            return response()->json(['message' => 'Invalid provider'], 400);
        }

        return Socialite::driver($provider)->stateless()->redirect();
    }

    /**
     * Handle social provider callback.
     */
    public function handleProviderCallback(string $provider)
    {
        if (! in_array($provider, ['google', 'facebook'])) {
            return redirect(config('app.frontend_url').'/login?error=invalid_provider');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return redirect(config('app.frontend_url').'/login?error=oauth_failed');
        }

        // Check deleted_accounts
        $banned = DeletedAccount::where('email', $socialUser->getEmail())->first();

        if ($banned) {
            return redirect(config('app.frontend_url').'/auth/callback?error=banned&reason='.urlencode($banned->reason));
        }

        $columnId = ($provider === 'google') ? 'google_id' : 'facebook_id';

        // Try to find by social ID or email
        $customer = Customer::where($columnId, $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        if ($customer) {
            // Update social ID if missing
            if (! $customer->$columnId) {
                $customer->update([$columnId => $socialUser->getId()]);
            }
        } else {
            // New user inside transaction
            $customer = DB::transaction(function () use ($socialUser, $provider, $columnId) {
                $names = explode(' ', $socialUser->getName(), 2);
                $firstName = $names[0] ?? 'User';
                $lastName = $names[1] ?? '';

                $lastId  = Customer::lockForUpdate()->orderByDesc('id')->value('id');
                $nextNum = $lastId ? ((int) substr($lastId, 5)) + 1 : 1;
                $newId   = 'CUST-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

                return Customer::create([
                    'id'              => $newId,
                    'first_name'      => $firstName,
                    'last_name'       => $lastName,
                    'email'           => $socialUser->getEmail(),
                    $columnId         => $socialUser->getId(),
                    'profile_picture' => $socialUser->getAvatar(),
                    'status'          => 'active',
                    'date_created'    => now(),
                ]);
            });
        }

        $token = $customer->createToken('customer-token', ['role:customer'], now()->addDays(30))->plainTextToken;

        return redirect(config('app.frontend_url').'/auth/callback?token='.$token.'&role=customer');
    }
}

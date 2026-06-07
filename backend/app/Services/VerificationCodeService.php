<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class VerificationCodeService
{
    private const CODE_LENGTH = 6;

    private const CODE_TTL = 600;

    private const MAX_ATTEMPTS = 3;

    private const LOCKOUT_DURATION = 600;

    private const RESEND_COOLDOWN = 60;

    public function generateCode(string $email, string $purpose): string
    {
        $code = $this->generateRandomCode();
        $cacheKey = $this->getCacheKey($email, $purpose);

        Cache::put($cacheKey, [
            'code' => $code,
            'attempts' => 0,
            'created_at' => time(),
            'expires_at' => time() + self::CODE_TTL,
        ], self::CODE_TTL);

        return $code;
    }

    public function verifyCode(string $email, string $purpose, string $inputCode): array
    {
        $cacheKey = $this->getCacheKey($email, $purpose);
        $data = Cache::get($cacheKey);

        if (! $data) {
            return [
                'success' => false,
                'message' => 'Verification code expired or not found. Please request a new one.',
            ];
        }

        $lockKey = $this->getLockKey($email, $purpose);
        $lockData = Cache::get($lockKey);
        if ($lockData && $lockData['locked_until'] > time()) {
            $remainingSeconds = $lockData['locked_until'] - time();

            return [
                'success' => false,
                'message' => "Too many failed attempts. Try again in {$remainingSeconds} seconds.",
                'locked' => true,
                'locked_until' => $lockData['locked_until'],
            ];
        }

        if ($inputCode !== $data['code']) {
            $data['attempts']++;
            Cache::put($cacheKey, $data, self::CODE_TTL);

            if ($data['attempts'] >= self::MAX_ATTEMPTS) {
                $lockedUntil = time() + self::LOCKOUT_DURATION;
                Cache::put($lockKey, [
                    'locked_until' => $lockedUntil,
                ], self::LOCKOUT_DURATION);

                return [
                    'success' => false,
                    'message' => 'Maximum attempts exceeded. Try again in '.(self::LOCKOUT_DURATION / 60).' minutes.',
                    'locked' => true,
                    'locked_until' => $lockedUntil,
                ];
            }

            $remainingAttempts = self::MAX_ATTEMPTS - $data['attempts'];

            return [
                'success' => false,
                'message' => "Invalid code. {$remainingAttempts} attempts remaining.",
                'attempts_remaining' => $remainingAttempts,
            ];
        }

        Cache::forget($cacheKey);
        Cache::forget($lockKey);

        return [
            'success' => true,
            'message' => 'Verification successful.',
        ];
    }

    public function canResend(string $email, string $purpose): array
    {
        $cacheKey = $this->getCacheKey($email, $purpose);
        $data = Cache::get($cacheKey);

        if (! $data) {
            return ['can_resend' => true, 'cooldown_remaining' => 0];
        }

        $elapsed = time() - $data['created_at'];
        $remaining = max(0, self::RESEND_COOLDOWN - $elapsed);

        return [
            'can_resend' => $remaining === 0,
            'cooldown_remaining' => $remaining,
        ];
    }

    private function generateRandomCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function getCacheKey(string $email, string $purpose): string
    {
        return "verification_code:{$purpose}:{$email}";
    }

    private function getLockKey(string $email, string $purpose): string
    {
        return "verification_lock:{$purpose}:{$email}";
    }
}

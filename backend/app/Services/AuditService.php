<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuditService
{
    public static function log(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?array $details = null,
        ?string $userId = null,
        ?string $userType = null,
    ): void {
        $user = auth()->user();

        DB::table('audit_logs')->insert([
            'id' => 'audit_'.Str::random(10),
            'user_id' => $userId ?? $user?->id,
            'user_type' => $userType ?? $user?->role,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details ? json_encode($details) : null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    public static function created(string $entityType, string $entityId, array $data = []): void
    {
        self::log('create', $entityType, $entityId, ['new_data' => $data]);
    }

    public static function updated(string $entityType, string $entityId, array $oldData = [], array $newData = []): void
    {
        self::log('update', $entityType, $entityId, [
            'old_data' => $oldData,
            'new_data' => $newData,
        ]);
    }

    public static function deleted(string $entityType, string $entityId, array $deletedData = []): void
    {
        self::log('delete', $entityType, $entityId, ['deleted_data' => $deletedData]);
    }

    public static function login(string $userId, string $userType): void
    {
        self::log('login', 'users', $userId, ['user_type' => $userType]);
    }

    public static function logout(string $userId, string $userType): void
    {
        self::log('logout', 'users', $userId, ['user_type' => $userType]);
    }

    public static function error(
        string $errorCode,
        string $errorType,
        string $errorMessage,
        ?string $severity = 'medium',
        ?array $context = null,
    ): void {
        $user = auth()->user();

        $details = [
            'error_code' => $errorCode,
            'error_type' => $errorType,
            'severity' => $severity,
            'error_message' => $errorMessage,
            'stack_trace' => $context['stack_trace'] ?? null,
            'request_payload' => isset($context['request']) ? json_encode($context['request']) : null,
            'endpoint' => $context['endpoint'] ?? request()->path(),
            'request_method' => $context['request_method'] ?? request()->method(),
        ];

        try {
            DB::table('audit_logs')->insert([
                'id' => 'audit_'.Str::random(10),
                'user_id' => $user?->id,
                'user_type' => $user?->role,
                'action' => 'error',
                'entity_type' => 'system',
                'entity_id' => null,
                'details' => json_encode($details),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'error_code' => $errorCode,
                'error_type' => $errorType,
                'severity' => $severity,
                'error_message' => $errorMessage,
                'stack_trace' => $details['stack_trace'],
                'request_payload' => $details['request_payload'],
                'endpoint' => $details['endpoint'],
                'request_method' => $details['request_method'],
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to insert audit log: ' . $e->getMessage(), [
                'original_error_code' => $errorCode,
                'original_error_message' => $errorMessage,
            ]);
        }
    }

    // Convenience methods for common errors
    public static function httpError(int $code, string $message, ?array $context = null): void
    {
        self::error((string)$code, 'HttpException', $message, self::getSeverityFromCode($code), $context);
    }

    public static function validationError(string $message, array $errors, ?array $context = null): void
    {
        self::error('422', 'ValidationException', $message, 'low', array_merge($context ?? [], ['validation_errors' => $errors]));
    }

    public static function unauthorized(string $message = 'Unauthorized access', ?array $context = null): void
    {
        self::error('401', 'UnauthorizedException', $message, 'high', $context);
    }

    public static function forbidden(string $message = 'Access forbidden', ?array $context = null): void
    {
        self::error('403', 'ForbiddenException', $message, 'medium', $context);
    }

    public static function notFound(string $entity = 'Resource', ?array $context = null): void
    {
        self::error('404', 'NotFoundException', "{$entity} not found", 'low', $context);
    }

    public static function serverError(string $message, ?array $context = null): void
    {
        self::error('500', 'ServerException', $message, 'critical', $context);
    }

    public static function suspiciousActivity(string $description, ?array $context = null): void
    {
        self::error('000', 'SuspiciousActivity', $description, 'high', $context);
    }

    // Payment related
    public static function paymentError(string $code, string $message, ?array $context = null): void
    {
        self::error($code, 'PaymentException', $message, 'high', array_merge($context ?? [], ['category' => 'payment']));
    }

    private static function getSeverityFromCode(int $code): string
    {
        return match($code) {
            400, 401, 403 => 'medium',
            402 => 'high',
            404, 422 => 'low',
            429, 500 => 'critical',
            502, 503, 504 => 'critical',
            default => 'low',
        };
    }
}

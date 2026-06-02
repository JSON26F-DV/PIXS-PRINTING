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
}

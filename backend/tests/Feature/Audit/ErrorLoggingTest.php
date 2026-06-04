<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

it('logs a 404 error through the middleware when hitting a non-existent endpoint', function () {
    // Hit a non-existent endpoint
    $response = $this->get('/api/does-not-exist-at-all');
    $response->assertStatus(404);

    // Verify audit log entry
    $log = DB::table('audit_logs')->where('action', 'error')->first();
    expect($log)->not->toBeNull();
    expect($log->error_code)->toBe('404');
    expect($log->error_type)->toBe('NotFoundException');
    expect($log->endpoint)->toBe('api/does-not-exist-at-all');
});

it('logs validation errors', function () {
    // Hit login endpoint with bad email and no password
    $response = $this->postJson('/api/auth/login', [
        'email' => 'invalid-email',
    ]);
    
    $response->assertStatus(422);

    // Verify audit log entry for validation failure
    $log = DB::table('audit_logs')->where('error_code', '422')->first();
    expect($log)->not->toBeNull();
    expect($log->error_type)->toBe('ValidationException');
});

it('logs uncaught exceptions using the exception handler', function () {
    // Register a test route that throws an exception
    Route::get('/api/test-throw-exception', function () {
        throw new \Exception('Test Uncaught Exception');
    });

    $response = $this->getJson('/api/test-throw-exception');
    $response->assertStatus(500);

    // Verify audit log entry
    $log = DB::table('audit_logs')->where('error_code', '500')->first();
    expect($log)->not->toBeNull();
    expect($log->error_type)->toBe('ServerException');
    expect($log->error_message)->toBe('Test Uncaught Exception');
});

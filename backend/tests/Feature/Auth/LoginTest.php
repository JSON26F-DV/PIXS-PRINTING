<?php

use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('login:127.0.0.1');
});

it('does not expose database errors during login', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'wrong-password',
    ]);

    expect($response->getContent())->not->toContain('SQLSTATE');
    expect($response->json('message'))->not->toContain('deleted_accounts');

    $response->assertJsonStructure(['message']);
});

it('rejects malformed email addresses with friendly validation errors', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'not-an-email',
        'password' => 'secret',
    ]);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    expect($response->json('errors.email.0'))->toBe('Please enter a valid email address.');
});

it('rejects suspicious characters in the email field', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => '<script>alert(1)</script>@test.com',
        'password' => 'secret',
    ]);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('requires a password', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'user@example.com',
        'password' => '',
    ]);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('trims and lowercases email before validation', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => '  USER@EXAMPLE.COM  ',
        'password' => 'secret',
    ]);

    expect($response->status())->toBeIn([401, 503]);
});

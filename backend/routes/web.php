<?php

use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// OAuth Callback routes for Socialite
Route::get('/api/auth/{provider}/callback', [RegisterController::class, 'handleProviderCallback'])
    ->where('provider', 'google|facebook');

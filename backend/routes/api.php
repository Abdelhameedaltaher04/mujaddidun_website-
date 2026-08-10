<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Users\ProfileController;
use App\Http\Controllers\Api\V1\Users\UserAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
|
| The /api/v1 prefix is applied by bootstrap/app.php. Domain routes should
 | be registered in their corresponding route modules as they are implemented.
|
*/

Route::get('/health', fn () => response()->json([
    'success' => true,
    'message' => 'API is ready.',
    'data' => [
        'version' => 'v1',
        'status' => 'ok',
    ],
]));

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar']);
    Route::post('/profile/password', [ProfileController::class, 'changePassword']);

    // Admin users management (authorization enforced by UserPolicy).
    Route::get('/users', [UserAdminController::class, 'index']);
    Route::get('/users/{user}', [UserAdminController::class, 'show'])->whereNumber('user');
    Route::put('/users/{user}', [UserAdminController::class, 'update'])->whereNumber('user');
    Route::patch('/users/{user}/status', [UserAdminController::class, 'updateStatus'])->whereNumber('user');
    Route::patch('/users/{user}/role', [UserAdminController::class, 'updateRole'])->whereNumber('user');
    Route::delete('/users/{user}', [UserAdminController::class, 'destroy'])->whereNumber('user');
});
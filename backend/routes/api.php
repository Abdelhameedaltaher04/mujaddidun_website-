<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
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
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});
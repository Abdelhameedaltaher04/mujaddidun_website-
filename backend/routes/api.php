<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Events\EventAdminController;
use App\Http\Controllers\Api\V1\Events\EventRegistrationController;
use App\Http\Controllers\Api\V1\Files\PublicFileController;
use App\Http\Controllers\Api\V1\News\NewsAdminController;
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

    // Admin news management (authorization enforced by NewsPolicy).
    Route::get('/news', [NewsAdminController::class, 'index']);
    Route::post('/news', [NewsAdminController::class, 'store']);
    Route::get('/news/{news}', [NewsAdminController::class, 'show'])->whereNumber('news');
    Route::put('/news/{news}', [NewsAdminController::class, 'update'])->whereNumber('news');
    Route::patch('/news/{news}/publish', [NewsAdminController::class, 'publish'])->whereNumber('news');
    Route::patch('/news/{news}/unpublish', [NewsAdminController::class, 'unpublish'])->whereNumber('news');
    Route::patch('/news/{news}/archive', [NewsAdminController::class, 'archive'])->whereNumber('news');
    Route::delete('/news/{news}', [NewsAdminController::class, 'destroy'])->whereNumber('news');

    // Admin events management (authorization enforced by EventPolicy).
    Route::get('/events', [EventAdminController::class, 'index']);
    Route::post('/events', [EventAdminController::class, 'store']);
    Route::get('/events/{event}', [EventAdminController::class, 'show'])->whereNumber('event');
    Route::put('/events/{event}', [EventAdminController::class, 'update'])->whereNumber('event');
    Route::patch('/events/{event}/publish', [EventAdminController::class, 'publish'])->whereNumber('event');
    Route::patch('/events/{event}/cancel', [EventAdminController::class, 'cancel'])->whereNumber('event');
    Route::delete('/events/{event}', [EventAdminController::class, 'destroy'])->whereNumber('event');

    // Event registrations.
    Route::get('/events/{event}/registrations', [EventRegistrationController::class, 'index'])->whereNumber('event');
    Route::post('/events/{event}/register', [EventRegistrationController::class, 'register'])->whereNumber('event');
    Route::patch('/registrations/{registration}/confirm', [EventRegistrationController::class, 'confirm'])->whereNumber('registration');
    Route::patch('/registrations/{registration}/cancel', [EventRegistrationController::class, 'cancel'])->whereNumber('registration');
    Route::patch('/registrations/{registration}/attended', [EventRegistrationController::class, 'attended'])->whereNumber('registration');
});

// Public file serving from the public storage disk (images are public
// site content; no auth required).
Route::get('/files/{path}', [PublicFileController::class, 'show'])
    ->where('path', '.*');
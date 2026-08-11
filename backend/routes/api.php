<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Events\EventAdminController;
use App\Http\Controllers\Api\V1\Events\EventRegistrationController;
use App\Http\Controllers\Api\V1\Files\PublicFileController;
use App\Http\Controllers\Api\V1\News\NewsAdminController;
use App\Http\Controllers\Api\V1\Gallery\GalleryAlbumController;
use App\Http\Controllers\Api\V1\Donations\DonationController;
use App\Http\Controllers\Api\V1\Faqs\FaqController;
use App\Http\Controllers\Api\V1\Gallery\GalleryImageController;
use App\Http\Controllers\Api\V1\Partners\PartnerController;
use App\Http\Controllers\Api\V1\Programs\ProgramAdminController;
use App\Http\Controllers\Api\V1\Programs\ProgramParticipantController;
use App\Http\Controllers\Api\V1\Users\ProfileController;
use App\Http\Controllers\Api\V1\Volunteers\VolunteerApplicationController;
use App\Http\Controllers\Api\V1\Volunteers\VolunteerDocumentController;
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

    // Admin programs management (authorization enforced by ProgramPolicy).
    Route::get('/programs', [ProgramAdminController::class, 'index']);
    Route::post('/programs', [ProgramAdminController::class, 'store']);
    Route::get('/programs/{program}', [ProgramAdminController::class, 'show'])->whereNumber('program');
    Route::put('/programs/{program}', [ProgramAdminController::class, 'update'])->whereNumber('program');
    Route::patch('/programs/{program}/activate', [ProgramAdminController::class, 'activate'])->whereNumber('program');
    Route::patch('/programs/{program}/deactivate', [ProgramAdminController::class, 'deactivate'])->whereNumber('program');
    Route::patch('/programs/{program}/archive', [ProgramAdminController::class, 'archive'])->whereNumber('program');
    Route::delete('/programs/{program}', [ProgramAdminController::class, 'destroy'])->whereNumber('program');

    // Program participants.
    Route::get('/programs/{program}/participants', [ProgramParticipantController::class, 'index'])->whereNumber('program');
    Route::post('/programs/{program}/participate', [ProgramParticipantController::class, 'participate'])->whereNumber('program');
    Route::patch('/participants/{participant}/approve', [ProgramParticipantController::class, 'approve'])->whereNumber('participant');
    Route::patch('/participants/{participant}/reject', [ProgramParticipantController::class, 'reject'])->whereNumber('participant');

    // Admin gallery management (authorization enforced by GalleryAlbumPolicy).
    Route::get('/gallery/albums', [GalleryAlbumController::class, 'index']);
    Route::post('/gallery/albums', [GalleryAlbumController::class, 'store']);
    Route::patch('/gallery/albums/reorder', [GalleryAlbumController::class, 'reorder']);
    Route::get('/gallery/albums/{album}', [GalleryAlbumController::class, 'show'])->whereNumber('album');
    Route::put('/gallery/albums/{album}', [GalleryAlbumController::class, 'update'])->whereNumber('album');
    Route::patch('/gallery/albums/{album}/status', [GalleryAlbumController::class, 'setStatus'])->whereNumber('album');
    Route::delete('/gallery/albums/{album}', [GalleryAlbumController::class, 'destroy'])->whereNumber('album');

    // Gallery images.
    Route::get('/gallery/albums/{album}/images', [GalleryImageController::class, 'index'])->whereNumber('album');
    Route::post('/gallery/albums/{album}/images', [GalleryImageController::class, 'store'])->whereNumber('album');
    Route::patch('/gallery/albums/{album}/images/reorder', [GalleryImageController::class, 'reorder'])->whereNumber('album');
    Route::put('/gallery/images/{image}', [GalleryImageController::class, 'update'])->whereNumber('image');
    Route::patch('/gallery/images/{image}/cover', [GalleryImageController::class, 'setAsCover'])->whereNumber('image');
    Route::delete('/gallery/images/{image}', [GalleryImageController::class, 'destroy'])->whereNumber('image');

    // Admin partners management (authorization enforced by PartnerPolicy).
    Route::get('/partners', [PartnerController::class, 'index']);
    Route::post('/partners', [PartnerController::class, 'store']);
    Route::patch('/partners/reorder', [PartnerController::class, 'reorder']);
    Route::get('/partners/{partner}', [PartnerController::class, 'show'])->whereNumber('partner');
    Route::put('/partners/{partner}', [PartnerController::class, 'update'])->whereNumber('partner');
    Route::patch('/partners/{partner}/status', [PartnerController::class, 'setStatus'])->whereNumber('partner');
    Route::delete('/partners/{partner}', [PartnerController::class, 'destroy'])->whereNumber('partner');

    // Admin FAQ management (authorization enforced by FaqPolicy).
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::patch('/faqs/reorder', [FaqController::class, 'reorder']);
    Route::get('/faqs/{faq}', [FaqController::class, 'show'])->whereNumber('faq');
    Route::put('/faqs/{faq}', [FaqController::class, 'update'])->whereNumber('faq');
    Route::patch('/faqs/{faq}/status', [FaqController::class, 'setStatus'])->whereNumber('faq');
    Route::delete('/faqs/{faq}', [FaqController::class, 'destroy'])->whereNumber('faq');

    // Admin donations management (authorization enforced by DonationPolicy;
    // read-only for moderators, state changes admin-only).
    Route::get('/donations', [DonationController::class, 'index']);
    Route::get('/donations/statistics', [DonationController::class, 'statistics']);
    Route::get('/donations/{donation}', [DonationController::class, 'show'])->whereNumber('donation');
    Route::patch('/donations/{donation}/status', [DonationController::class, 'setStatus'])->whereNumber('donation');
    Route::patch('/donations/{donation}/refund', [DonationController::class, 'refund'])->whereNumber('donation');
    Route::patch('/donations/{donation}/cancel', [DonationController::class, 'cancel'])->whereNumber('donation');

    // Volunteer applications management (authorization enforced by
    // VolunteerApplicationPolicy; admin/moderator only).
    Route::get('/volunteer-applications', [VolunteerApplicationController::class, 'index']);
    Route::get('/volunteer-applications/statistics', [VolunteerApplicationController::class, 'statistics']);
    Route::get('/volunteer-applications/{application}', [VolunteerApplicationController::class, 'show'])->whereNumber('application');
    Route::patch('/volunteer-applications/{application}/status', [VolunteerApplicationController::class, 'setStatus'])->whereNumber('application');
    Route::get('/volunteer-applications/{application}/notes', [VolunteerApplicationController::class, 'notes'])->whereNumber('application');
    Route::post('/volunteer-applications/{application}/notes', [VolunteerApplicationController::class, 'storeNote'])->whereNumber('application');
    Route::get('/volunteer-applications/{application}/documents', [VolunteerApplicationController::class, 'documents'])->whereNumber('application');
});

// Private volunteer documents: served via short-lived signed URLs
// (relative signatures) generated only for authorized reviewers.
Route::get('/volunteer-documents/{document}', [VolunteerDocumentController::class, 'download'])
    ->whereNumber('document')
    ->name('volunteer-documents.download')
    ->middleware('signed:relative');

// Public file serving from the public storage disk (images are public
// site content; no auth required).
Route::get('/files/{path}', [PublicFileController::class, 'show'])
    ->where('path', '.*');
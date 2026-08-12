<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Events\EventAdminController;
use App\Http\Controllers\Api\V1\Events\EventRegistrationController;
use App\Http\Controllers\Api\V1\Files\PublicFileController;
use App\Http\Controllers\Api\V1\News\NewsAdminController;
use App\Http\Controllers\Api\V1\Gallery\GalleryAlbumController;
use App\Http\Controllers\Api\V1\Contact\ContactMessageController;
use App\Http\Controllers\Api\V1\Donations\DonationController;
use App\Http\Controllers\Api\V1\Settings\SettingsController;
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

    // Article gallery images (same policy as the article itself).
    Route::get('/news/{news}/images', [\App\Http\Controllers\Api\V1\News\NewsImageController::class, 'index'])->whereNumber('news');
    Route::post('/news/{news}/images', [\App\Http\Controllers\Api\V1\News\NewsImageController::class, 'store'])->whereNumber('news');
    Route::patch('/news/{news}/images/reorder', [\App\Http\Controllers\Api\V1\News\NewsImageController::class, 'reorder'])->whereNumber('news');
    Route::delete('/news/images/{image}', [\App\Http\Controllers\Api\V1\News\NewsImageController::class, 'destroy'])->whereNumber('image');

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
    // Public-site alias for the same guarded self-registration action.
    Route::post('/public/events/{event}/register', [EventRegistrationController::class, 'register'])->whereNumber('event');
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
    // Public-site alias for the same guarded self-participation action.
    Route::post('/public/programs/{program}/participate', [ProgramParticipantController::class, 'participate'])->whereNumber('program');
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

    // Contact messages management (authorization enforced by
    // ContactMessagePolicy; admin/moderator only).
    Route::get('/contact-messages', [ContactMessageController::class, 'index']);
    Route::get('/contact-messages/statistics', [ContactMessageController::class, 'statistics']);
    Route::get('/contact-messages/{message}', [ContactMessageController::class, 'show'])->whereNumber('message');
    Route::patch('/contact-messages/{message}/read', [ContactMessageController::class, 'setRead'])->whereNumber('message');
    Route::patch('/contact-messages/{message}/status', [ContactMessageController::class, 'setStatus'])->whereNumber('message');
    Route::patch('/contact-messages/{message}/archive', [ContactMessageController::class, 'archive'])->whereNumber('message');
    Route::post('/contact-messages/{message}/reply', [ContactMessageController::class, 'reply'])->whereNumber('message');
    Route::delete('/contact-messages/{message}', [ContactMessageController::class, 'destroy'])->whereNumber('message');

    // Admin dashboard statistics (admin only; enforced in controller).
    Route::get('/admin/dashboard/statistics', [\App\Http\Controllers\Api\V1\Dashboard\DashboardController::class, 'statistics']);
    Route::get('/admin/dashboard/charts', [\App\Http\Controllers\Api\V1\Dashboard\DashboardController::class, 'charts']);
    Route::get('/admin/dashboard/activities', [\App\Http\Controllers\Api\V1\Dashboard\DashboardController::class, 'activities']);

    // Website settings (admin only; enforced by WebsiteSettingPolicy).
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings/{section}', [SettingsController::class, 'update'])
        ->whereIn('section', ['general', 'contact', 'social', 'branding', 'seo', 'email', 'controls']);

    // Website content management (admin only; enforced by
    // WebsiteSettingPolicy — same admin-only surface as settings).
    Route::get('/content', [\App\Http\Controllers\Api\V1\Content\WebsiteContentController::class, 'index']);
    Route::put('/content/homepage-sections', [\App\Http\Controllers\Api\V1\Content\HomepageSectionController::class, 'update']);
    Route::post('/content/statistics', [\App\Http\Controllers\Api\V1\Content\SiteStatisticController::class, 'store']);
    Route::patch('/content/statistics/reorder', [\App\Http\Controllers\Api\V1\Content\SiteStatisticController::class, 'reorder']);
    Route::put('/content/statistics/{statistic}', [\App\Http\Controllers\Api\V1\Content\SiteStatisticController::class, 'update'])->whereNumber('statistic');
    Route::delete('/content/statistics/{statistic}', [\App\Http\Controllers\Api\V1\Content\SiteStatisticController::class, 'destroy'])->whereNumber('statistic');
    Route::post('/content/ctas', [\App\Http\Controllers\Api\V1\Content\SiteCtaSectionController::class, 'store']);
    Route::patch('/content/ctas/reorder', [\App\Http\Controllers\Api\V1\Content\SiteCtaSectionController::class, 'reorder']);
    Route::put('/content/ctas/{cta}', [\App\Http\Controllers\Api\V1\Content\SiteCtaSectionController::class, 'update'])->whereNumber('cta');
    Route::delete('/content/ctas/{cta}', [\App\Http\Controllers\Api\V1\Content\SiteCtaSectionController::class, 'destroy'])->whereNumber('cta');
    Route::put('/content/{section}', [\App\Http\Controllers\Api\V1\Content\WebsiteContentController::class, 'update'])
        ->whereIn('section', ['hero', 'about', 'vision_mission', 'footer']);
});

// Sanitized public settings for the public website (no auth; the email
// section and any server configuration are never included).
Route::get('/settings/public', [SettingsController::class, 'publicIndex']);
Route::get('/public/settings', [SettingsController::class, 'publicIndex']);

// Sanitized public website content (no auth): homepage sections order and
// visibility, active statistics/CTAs, and singleton content sections.
Route::get('/public/content', [\App\Http\Controllers\Api\V1\Content\WebsiteContentController::class, 'publicIndex']);

// Public contact form (no auth). Rate limited per IP; a honeypot field in
// the request rejects naive bots.
Route::post('/public/contact-messages', [\App\Http\Controllers\Api\V1\Contact\PublicContactMessageController::class, 'store'])
    ->middleware('throttle:5,1');

// Public read-only news (no auth). Only published articles are exposed;
// drafts and archived articles 404 / are absent from lists.
// Public read-only events (no auth). Draft and cancelled events are never exposed.
Route::get('/public/events', [\App\Http\Controllers\Api\V1\Events\PublicEventController::class, 'index']);
Route::get('/public/events/{event}', [\App\Http\Controllers\Api\V1\Events\PublicEventController::class, 'show'])
    ->whereNumber('event');

// Public read-only partners (no auth). Only active partners are exposed.
Route::get('/public/partners', [\App\Http\Controllers\Api\V1\Partners\PublicPartnerController::class, 'index']);

// Public donation intent (no auth). Recorded as pending — no online payment
// gateway is integrated; admins confirm payments (e.g. bank transfers).
// Rate limited per IP; a honeypot field in the request rejects naive bots.
Route::post('/public/donations', [\App\Http\Controllers\Api\V1\Donations\PublicDonationController::class, 'store'])
    ->middleware('throttle:5,1');

// Public read-only FAQs (no auth). Only published FAQs are exposed.
Route::get('/public/faqs', [\App\Http\Controllers\Api\V1\Faqs\PublicFaqController::class, 'index']);
Route::get('/public/faqs/{faq}', [\App\Http\Controllers\Api\V1\Faqs\PublicFaqController::class, 'show'])
    ->whereNumber('faq');

// Public read-only gallery (no auth). Only published albums are exposed.
Route::get('/public/gallery/albums', [\App\Http\Controllers\Api\V1\Gallery\PublicGalleryController::class, 'index']);
Route::get('/public/gallery/albums/{album}', [\App\Http\Controllers\Api\V1\Gallery\PublicGalleryController::class, 'show'])
    ->whereNumber('album');
Route::get('/public/gallery/albums/{album}/images', [\App\Http\Controllers\Api\V1\Gallery\PublicGalleryController::class, 'images'])
    ->whereNumber('album');

// Public read-only programs (no auth). Draft and archived programs are never exposed.
Route::get('/public/programs', [\App\Http\Controllers\Api\V1\Programs\PublicProgramController::class, 'index']);
Route::get('/public/programs/{program}', [\App\Http\Controllers\Api\V1\Programs\PublicProgramController::class, 'show'])
    ->whereNumber('program');

Route::get('/public/news', [\App\Http\Controllers\Api\V1\News\PublicNewsController::class, 'index']);
Route::get('/public/news/{news}', [\App\Http\Controllers\Api\V1\News\PublicNewsController::class, 'show'])
    ->whereNumber('news');

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
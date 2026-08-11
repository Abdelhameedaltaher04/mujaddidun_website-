<?php

namespace App\Http\Controllers\Api\V1\Files;

use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves files from the public storage disk through the routed /api path.
 * The preview proxy only forwards /api/* to Laravel, so the conventional
 * /storage symlink URL is unreachable from the browser.
 */
class PublicFileController extends BaseController
{
    /** Directories on the public disk that may be served publicly. */
    private const ALLOWED_PREFIXES = ['news-covers/', 'news-images/', 'event-covers/', 'program-covers/', 'gallery-covers/', 'gallery-images/', 'partner-logos/', 'site-branding/'];

    public function show(string $path): Response
    {
        $disk = Storage::disk('public');

        // Only whitelisted directories, no traversal or absolute paths.
        $allowed = false;
        foreach (self::ALLOWED_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $allowed = true;
                break;
            }
        }

        if (! $allowed || str_contains($path, '..') || str_starts_with($path, '/')) {
            abort(404);
        }

        if (! $disk->exists($path)) {
            abort(404);
        }

        // News covers and gallery images belong to a specific article:
        // only serve them while that article is published, unless the
        // caller is a staff member (dashboard previews of drafts). Staff-
        // only responses must never be cacheable by shared proxies.
        $staffOnly = false;

        if (str_starts_with($path, 'news-covers/')) {
            if (! $this->newsCoverIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'news-images/')) {
            if (! $this->newsGalleryImageIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'event-covers/')) {
            if (! $this->eventCoverIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        // Containment check: the canonical path must stay inside the disk
        // root (defends against encoded traversal and symlinked entries).
        $root = realpath($disk->path(''));
        $real = realpath($disk->path($path));
        if ($root === false || $real === false || ! str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
            abort(404);
        }

        $headers = [
            'Cache-Control' => $staffOnly ? 'private, no-store' : 'public, max-age=86400',
        ];

        // SVGs can embed scripts; neutralize them when rendered directly.
        if (str_ends_with(strtolower($path), '.svg')) {
            $headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
            $headers['X-Content-Type-Options'] = 'nosniff';
        }

        return $disk->response($path, null, $headers);
    }

    private function newsCoverIsPublic(string $path): bool
    {
        return \App\Models\News::query()
            ->where('cover_image_path', $path)
            ->where('status', 'published')
            ->exists();
    }

    private function eventCoverIsPublic(string $path): bool
    {
        return \App\Models\Event::query()
            ->where('cover_image_path', $path)
            ->whereIn('status', ['upcoming', 'ongoing', 'completed'])
            ->exists();
    }

    private function newsGalleryImageIsPublic(string $path): bool
    {
        return \App\Models\NewsImage::query()
            ->where('image', $path)
            ->whereHas('news', fn ($query) => $query->where('status', 'published'))
            ->exists();
    }

    /**
     * Orphaned or unpublished files stay hidden from the public; staff
     * with a valid bearer token may still access them (dashboard previews).
     */
    private function isStaff(): bool
    {
        $user = auth('sanctum')->user();

        return $user !== null
            && in_array($user->role?->slug, ['admin', 'moderator'], true);
    }
}

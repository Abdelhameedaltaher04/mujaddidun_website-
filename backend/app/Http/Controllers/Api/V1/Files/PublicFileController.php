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
    private const ALLOWED_PREFIXES = ['news-covers/', 'news-images/', 'event-covers/', 'program-covers/', 'gallery-covers/', 'gallery-images/', 'partner-logos/', 'site-branding/', 'profile-avatars/', 'content-images/'];

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

        if (str_starts_with($path, 'program-covers/')) {
            if (! $this->programCoverIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'partner-logos/')) {
            if (! $this->partnerLogoIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'gallery-covers/')) {
            if (! $this->galleryCoverIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'gallery-images/')) {
            if (! $this->galleryImageIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        if (str_starts_with($path, 'content-images/')) {
            if (! $this->contentImageIsPublic($path)) {
                abort_unless($this->isStaff(), 404);
                $staffOnly = true;
            }
        }

        // Avatars are only served while a user actually owns them; orphaned
        // files in the directory remain hidden. Filenames are unguessable
        // random hashes, which is the standard exposure model for avatars
        // rendered through plain <img> tags (no bearer header available).
        if (str_starts_with($path, 'profile-avatars/')) {
            abort_unless($this->avatarIsInUse($path), 404);
        }

        // Containment check: the canonical path must stay inside the disk
        // root (defends against encoded traversal and symlinked entries).
        $root = realpath($disk->path(''));
        $real = realpath($disk->path($path));
        if ($root === false || $real === false || ! str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
            abort(404);
        }

        // Partner logos and content images use a short public TTL so
        // deactivating them revokes public access within minutes.
        $publicCache = str_starts_with($path, 'partner-logos/') || str_starts_with($path, 'content-images/')
            ? 'public, max-age=300'
            : 'public, max-age=86400';

        $headers = [
            'Cache-Control' => $staffOnly ? 'private, no-store' : $publicCache,
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

    private function programCoverIsPublic(string $path): bool
    {
        return \App\Models\Program::query()
            ->where('cover_image_path', $path)
            ->whereIn('status', ['active', 'completed'])
            ->exists();
    }

    private function partnerLogoIsPublic(string $path): bool
    {
        return \App\Models\Partner::query()
            ->where('logo_path', $path)
            ->where('status', 'active')
            ->exists();
    }

    private function galleryCoverIsPublic(string $path): bool
    {
        return \App\Models\GalleryAlbum::query()
            ->where('cover_image_path', $path)
            ->where('status', 'published')
            ->exists();
    }

    private function galleryImageIsPublic(string $path): bool
    {
        return \App\Models\GalleryImage::query()
            ->where('file_path', $path)
            ->whereHas('album', fn ($query) => $query->where('status', 'published'))
            ->exists();
    }

    /**
     * A content image is public only while an ACTIVE CTA or an ACTIVE
     * singleton content section (hero/about) references it.
     */
    private function contentImageIsPublic(string $path): bool
    {
        if (\App\Models\SiteCtaSection::query()
            ->where('image_path', $path)
            ->where('is_active', true)
            ->exists()) {
            return true;
        }

        $service = app(\App\Services\Content\WebsiteContentService::class);
        foreach (['hero' => 'background_image_path', 'about' => 'image_path'] as $section => $pathKey) {
            $values = $service->section($section);
            if (($values[$pathKey] ?? null) === $path && ! empty($values['is_active'])) {
                return true;
            }
        }

        return false;
    }

    private function avatarIsInUse(string $path): bool
    {
        return \App\Models\User::query()
            ->where('avatar_path', $path)
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

<?php

namespace App\Policies;

use App\Models\GalleryAlbum;
use App\Models\User;

/**
 * Gallery management (albums and images) is available to admins and
 * moderators alike.
 */
class GalleryAlbumPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, GalleryAlbum $album): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, GalleryAlbum $album): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, GalleryAlbum $album): bool
    {
        return $this->isEditor($actor);
    }

    public function manageImages(User $actor, GalleryAlbum $album): bool
    {
        return $this->isEditor($actor);
    }
}

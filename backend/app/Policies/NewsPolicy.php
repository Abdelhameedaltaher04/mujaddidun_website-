<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;

/**
 * News management is available to admins and moderators alike.
 */
class NewsPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, News $news): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, News $news): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, News $news): bool
    {
        return $this->isEditor($actor);
    }
}

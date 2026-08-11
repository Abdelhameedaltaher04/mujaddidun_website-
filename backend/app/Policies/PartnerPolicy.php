<?php

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

/** Partner management is available to admins and moderators alike. */
class PartnerPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, Partner $partner): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, Partner $partner): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, Partner $partner): bool
    {
        return $this->isEditor($actor);
    }
}

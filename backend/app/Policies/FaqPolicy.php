<?php

namespace App\Policies;

use App\Models\Faq;
use App\Models\User;

/** FAQ management is available to admins and moderators alike. */
class FaqPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, Faq $faq): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, Faq $faq): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, Faq $faq): bool
    {
        return $this->isEditor($actor);
    }
}

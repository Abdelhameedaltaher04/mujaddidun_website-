<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VolunteerApplication;

/**
 * Volunteer applications are reviewed by admins and moderators. They are
 * never exposed publicly — regular members have no access at all.
 */
class VolunteerApplicationPolicy
{
    private function isReviewer(User $user): bool
    {
        return in_array($user->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $user): bool
    {
        return $this->isReviewer($user);
    }

    public function view(User $user, VolunteerApplication $application): bool
    {
        return $this->isReviewer($user);
    }

    /** Status changes, internal notes, and private document access. */
    public function manage(User $user, VolunteerApplication $application): bool
    {
        return $this->isReviewer($user);
    }
}

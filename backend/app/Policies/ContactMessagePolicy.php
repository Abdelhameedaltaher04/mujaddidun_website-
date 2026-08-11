<?php

namespace App\Policies;

use App\Models\ContactMessage;
use App\Models\User;

/**
 * Contact messages contain private sender information. Only admins and
 * moderators (the inbox staff) may access or manage them; they are never
 * exposed publicly.
 */
class ContactMessagePolicy
{
    private function isStaff(User $user): bool
    {
        return in_array($user->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, ContactMessage $message): bool
    {
        return $this->isStaff($user);
    }

    /** Read toggles, status changes, archive, and replies. */
    public function manage(User $user, ContactMessage $message): bool
    {
        return $this->isStaff($user);
    }

    public function delete(User $user, ContactMessage $message): bool
    {
        return $this->isStaff($user);
    }
}

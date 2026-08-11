<?php

namespace App\Policies;

use App\Models\Donation;
use App\Models\User;

/**
 * Donations are sensitive: admins and moderators may view, but only
 * admins may change donation state (complete/fail/refund/cancel).
 */
class DonationPolicy
{
    private function isViewer(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isViewer($actor);
    }

    public function view(User $actor, Donation $donation): bool
    {
        return $this->isViewer($actor);
    }

    public function manage(User $actor, Donation $donation): bool
    {
        return $actor->role?->slug === 'admin';
    }
}

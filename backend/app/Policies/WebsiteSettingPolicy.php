<?php

namespace App\Policies;

use App\Models\User;

/**
 * Website settings are admin-only, both reading the admin payload (it
 * includes email/sender configuration) and every modification.
 * Moderators receive 403; the public site uses the separate sanitized
 * public endpoint instead.
 */
class WebsiteSettingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role?->slug === 'admin';
    }

    public function manage(User $user): bool
    {
        return $user->role?->slug === 'admin';
    }
}

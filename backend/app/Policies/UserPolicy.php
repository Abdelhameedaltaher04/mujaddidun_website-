<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Admins and moderators may browse the users list; all destructive
     * management actions are strictly admin-only per product rules.
     */
    public function viewAny(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function view(User $actor, User $target): bool
    {
        return $this->viewAny($actor);
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->role?->slug === 'admin';
    }

    public function updateStatus(User $actor, User $target): bool
    {
        return $actor->role?->slug === 'admin';
    }

    public function updateRole(User $actor, User $target): bool
    {
        return $actor->role?->slug === 'admin';
    }

    public function delete(User $actor, User $target): bool
    {
        return $actor->role?->slug === 'admin';
    }
}

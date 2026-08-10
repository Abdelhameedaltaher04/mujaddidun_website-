<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

/**
 * Event management (including registrations) is available to admins and
 * moderators alike.
 */
class EventPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, Event $event): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, Event $event): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, Event $event): bool
    {
        return $this->isEditor($actor);
    }

    public function manageRegistrations(User $actor, Event $event): bool
    {
        return $this->isEditor($actor);
    }
}

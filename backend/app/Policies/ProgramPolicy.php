<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

/**
 * Program management (including participants) is available to admins and
 * moderators alike.
 */
class ProgramPolicy
{
    private function isEditor(User $actor): bool
    {
        return in_array($actor->role?->slug, ['admin', 'moderator'], true);
    }

    public function viewAny(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function view(User $actor, Program $program): bool
    {
        return $this->isEditor($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isEditor($actor);
    }

    public function update(User $actor, Program $program): bool
    {
        return $this->isEditor($actor);
    }

    public function delete(User $actor, Program $program): bool
    {
        return $this->isEditor($actor);
    }

    public function manageParticipants(User $actor, Program $program): bool
    {
        return $this->isEditor($actor);
    }
}

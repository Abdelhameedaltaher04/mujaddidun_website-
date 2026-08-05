<?php

namespace App\Services\Users;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileService
{
    public function update(User $user, array $attributes, ?UploadedFile $avatar = null): User
    {
        $removeAvatar = (bool) ($attributes['remove_avatar'] ?? false);
        unset($attributes['avatar'], $attributes['remove_avatar']);

        if ($avatar) {
            $this->deleteAvatar($user);
            $attributes['avatar_path'] = $avatar->store('profile-avatars', 'public');
        } elseif ($removeAvatar) {
            $this->deleteAvatar($user);
            $attributes['avatar_path'] = null;
        }

        $user->fill($attributes)->save();

        return $user->fresh('role');
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (! Hash::check($currentPassword, $user->password)) {
            return false;
        }

        $user->forceFill(['password' => Hash::make($newPassword)])->save();

        return true;
    }

    public function removeAvatar(User $user): User
    {
        $this->deleteAvatar($user);
        $user->forceFill(['avatar_path' => null])->save();

        return $user->fresh('role');
    }

    private function deleteAvatar(User $user): void
    {
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }
    }
}
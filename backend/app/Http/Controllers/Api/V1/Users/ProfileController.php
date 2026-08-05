<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Users\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Users\UpdateProfileRequest;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Services\Users\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends BaseController
{
    public function __construct(private readonly ProfileService $profileService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return $this->success([
            'user' => new UserResource($request->user()->load('role')),
        ], 'Profile retrieved successfully.');
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profileService->update(
            $request->user(),
            $request->validated(),
            $request->file('avatar'),
        );

        return $this->success([
            'user' => new UserResource($user),
        ], 'Profile updated successfully.');
    }

    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $this->profileService->removeAvatar($request->user());

        return $this->success([
            'user' => new UserResource($user),
        ], 'Profile picture removed successfully.');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $changed = $this->profileService->changePassword(
            $request->user(),
            $request->string('current_password')->toString(),
            $request->string('new_password')->toString(),
        );

        if (! $changed) {
            return $this->error(
                'The current password is incorrect.',
                ['current_password' => ['The current password is incorrect.']],
                422,
            );
        }

        return $this->success(null, 'Password changed successfully.');
    }
}
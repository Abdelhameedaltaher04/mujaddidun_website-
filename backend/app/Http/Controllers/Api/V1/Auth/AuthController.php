<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Auth\ResendVerificationRequest;
use App\Http\Resources\Api\V1\Auth\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Auth\Events\Verified;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Password;

class AuthController extends BaseController
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            $request->validated(),
            $request->userAgent() ?: 'api-client',
        );

        return $this->success([
            'user' => new UserResource($result['user']),
            'email_verification_required' => true,
        ], 'Registration completed. Please verify your email address.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->userAgent() ?: 'api-client',
        );

        if ($result === null) {
            return $this->error(
                'The provided credentials are incorrect.',
                ['email' => ['The provided credentials are incorrect.']],
                401,
            );
        }

        if ($result['email_not_verified'] ?? false) {
            return $this->error(
                'Email address is not verified.',
                ['code' => ['email_not_verified']],
                403,
            );
        }

        return $this->success([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
            'token_type' => $result['token_type'],
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user(), $request->bearerToken());

        return $this->success(null, 'Logout successful.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success([
            'user' => new UserResource($request->user()->load('role')),
        ], 'Authenticated user retrieved successfully.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->sendPasswordResetLink($request->string('email')->toString());

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error(
                'Unable to send the password reset link.',
                ['email' => [__($status)]],
                422,
            );
        }

        return $this->success(null, 'Password reset link sent successfully.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->resetPassword($request->validated());

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error(
                'Unable to reset the password.',
                ['email' => [__($status)]],
                422,
            );
        }

        return $this->success(null, 'Password reset successfully.');
    }

    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        if (! $request->hasValidSignature()) {
            return $this->error('The email verification link is invalid or expired.', null, 400);
        }

        $user = User::query()->find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->error('The email verification link is invalid.', null, 400);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return $this->success([
            'user' => new UserResource($user->fresh('role')),
        ], 'Email address verified successfully.');
    }

    public function resendVerification(ResendVerificationRequest $request): JsonResponse
    {
        $result = $this->authService->resendEmailVerification(
            $request->string('email')->toString(),
        );

        if ($result['throttled']) {
            return $this->error(
                'Please wait before requesting another verification email.',
                ['retry_after' => [(string) $result['retry_after']]],
                429,
            );
        }

        return $this->success([
            'email_verification_sent' => $result['sent'],
            'retry_after' => $result['retry_after'],
        ], 'If the account exists and is not verified, a verification email has been sent.');
    }
}
<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Users\ListUsersRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRoleRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserStatusRequest;
use App\Http\Resources\Api\V1\Users\AdminUserResource;
use App\Mail\AccountActivatedMail;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UserAdminController extends BaseController
{
    /** GET /api/v1/users — server-side search, filters, pagination. */
    public function index(ListUsersRequest $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->validated();

        $query = User::query()->with('role');

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $query->where(function ($q) use ($search): void {
                // Explicit ESCAPE clause so %/_ are literal on every driver.
                $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
                $q->whereRaw("first_name like ? escape '\\'", [$like])
                    ->orWhereRaw("last_name like ? escape '\\'", [$like])
                    ->orWhereRaw("concat(first_name, ' ', last_name) like ? escape '\\'", [$like])
                    ->orWhereRaw("email like ? escape '\\'", [$like])
                    ->orWhereRaw("phone like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['role'])) {
            $query->whereHas('role', fn ($q) => $q->where('slug', $filters['role']));
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['verified'])) {
            $filters['verified'] === 'verified'
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        if (! empty($filters['registered_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['registered_from'])->startOfDay());
        }

        if (! empty($filters['registered_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['registered_to'])->endOfDay());
        }

        $paginator = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully.',
            'data' => AdminUserResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    /** GET /api/v1/users/{user} */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->success(
            new AdminUserResource($user->load('role')),
            'User retrieved successfully.',
        );
    }

    /** PUT /api/v1/users/{user} */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $input = $request->validated();
        $actor = $request->user();

        if ($actor->is($user)) {
            if ($input['role'] !== $user->role->slug) {
                return $this->error('You cannot change your own role.', [], 422);
            }
            if ($input['status'] !== $user->status) {
                return $this->error('You cannot change your own status.', [], 422);
            }
        }

        $role = Role::query()->where('slug', $input['role'])->firstOrFail();

        $user->fill([
            'first_name' => $input['first_name'],
            'last_name' => $input['last_name'],
            'phone' => $input['phone'],
            'country_code' => array_key_exists('country_code', $input)
                ? $input['country_code']
                : $user->country_code,
            'status' => $input['status'],
            'role_id' => $role->id,
        ]);
        $user->save();

        $this->revokeTokensIfSuspended($user);

        return $this->success(
            new AdminUserResource($user->load('role')),
            'User updated successfully.',
        );
    }

    /** PATCH /api/v1/users/{user}/status */
    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        $this->authorize('updateStatus', $user);

        if ($request->user()->is($user)) {
            return $this->error('You cannot change your own status.', [], 422);
        }

        $status = $request->validated('status');
        // Captured before the write so the notification fires only on a real
        // transition into `active` — re-confirming an already-active account
        // must not send a second activation email.
        $wasActive = $user->status === 'active';

        $user->update(['status' => $status]);
        $this->revokeTokensIfSuspended($user);

        if ($status === 'active' && ! $wasActive) {
            $this->sendActivationEmail($user);
        }

        return $this->success(
            new AdminUserResource($user->load('role')),
            'User status updated successfully.',
        );
    }

    /**
     * Tells the member their account was approved. Delivery problems must not
     * fail the request: the status change is already committed and correct, so
     * a mail outage would otherwise leave the admin retrying an action that
     * actually succeeded. The failure is logged for the operator instead, and
     * the exception is never surfaced to the client.
     */
    private function sendActivationEmail(User $user): void
    {
        if (blank($user->email)) {
            return;
        }

        try {
            Mail::to($user->email)->send(new AccountActivatedMail($user));
        } catch (\Throwable $exception) {
            Log::error('Account activation email could not be sent.', [
                'user_id' => $user->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    /** PATCH /api/v1/users/{user}/role */
    public function updateRole(UpdateUserRoleRequest $request, User $user): JsonResponse
    {
        $this->authorize('updateRole', $user);

        if ($request->user()->is($user)) {
            return $this->error('You cannot change your own role.', [], 422);
        }

        $role = Role::query()
            ->where('slug', $request->validated('role'))
            ->firstOrFail();

        $user->update(['role_id' => $role->id]);

        return $this->success(
            new AdminUserResource($user->load('role')),
            'User role updated successfully.',
        );
    }

    /** DELETE /api/v1/users/{user} — soft delete + token revocation. */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if (request()->user()->is($user)) {
            return $this->error('You cannot delete your own account.', [], 422);
        }

        $user->tokens()->delete();

        // Tombstone the unique email so the address can be re-registered
        // later; the soft-deleted row keeps the original in a recoverable way.
        $user->forceFill([
            'email' => $user->email.'.deleted.'.now()->timestamp,
        ])->save();

        $user->delete();

        return $this->success(null, 'User deleted successfully.');
    }

    /** Suspended/deactivated users must not keep valid API tokens. */
    private function revokeTokensIfSuspended(User $user): void
    {
        if (in_array($user->status, ['suspended', 'deactivated'], true)) {
            $user->tokens()->delete();
        }
    }
}

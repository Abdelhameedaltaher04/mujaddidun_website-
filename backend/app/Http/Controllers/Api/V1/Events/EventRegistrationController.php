<?php

namespace App\Http\Controllers\Api\V1\Events;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Events\ListRegistrationsRequest;
use App\Http\Resources\Api\V1\Events\EventRegistrationResource;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventRegistrationController extends BaseController
{
    /** GET /api/v1/events/{event}/registrations */
    public function index(ListRegistrationsRequest $request, Event $event): JsonResponse
    {
        $this->authorize('manageRegistrations', $event);

        $filters = $request->validated();

        $query = $event->registrations();

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("full_name like ? escape '\\'", [$like])
                    ->orWhereRaw("email like ? escape '\\'", [$like])
                    ->orWhereRaw("phone like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $paginator = $query
            ->orderByDesc('registered_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Registrations retrieved successfully.',
            'data' => EventRegistrationResource::collection($paginator->items()),
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

    /** PATCH /api/v1/registrations/{registration}/confirm */
    public function confirm(EventRegistration $registration): JsonResponse
    {
        return $this->setStatus($registration, 'confirmed', 'Registration confirmed successfully.');
    }

    /** PATCH /api/v1/registrations/{registration}/cancel */
    public function cancel(EventRegistration $registration): JsonResponse
    {
        return $this->setStatus($registration, 'cancelled', 'Registration cancelled successfully.');
    }

    /** PATCH /api/v1/registrations/{registration}/attended */
    public function attended(EventRegistration $registration): JsonResponse
    {
        return $this->setStatus($registration, 'attended', 'Attendance recorded successfully.');
    }

    private function setStatus(EventRegistration $registration, string $status, string $message): JsonResponse
    {
        // The event relation excludes soft-deleted parents; treat orphaned
        // registrations as not found rather than failing authorization.
        $event = $registration->event;
        abort_if($event === null, 404);

        $this->authorize('manageRegistrations', $event);

        $registration->status = $status;
        $registration->cancelled_at = $status === 'cancelled' ? now() : null;
        $registration->save();

        return $this->success(new EventRegistrationResource($registration), $message);
    }

    /**
     * POST /api/v1/events/{event}/register — self-registration for the
     * authenticated user (server-side guards required by the spec; the
     * public site will consume this endpoint later).
     */
    public function register(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        // Serialize concurrent registrations for the same event so two
        // requests cannot both take the last seat or double-register.
        try {
            return DB::transaction(function () use ($event, $user) {
                $event = Event::query()->lockForUpdate()->findOrFail($event->id);

                return $this->attemptRegistration($event, $user);
            });
        } catch (UniqueConstraintViolationException) {
            return $this->error('You are already registered for this event.', null, 422);
        }
    }

    private function attemptRegistration(Event $event, User $user): JsonResponse
    {
        if ($event->status === 'cancelled') {
            return $this->error('This event has been cancelled.', null, 422);
        }

        if (! in_array($event->status, ['upcoming', 'ongoing'], true)) {
            return $this->error('Registration is not available for this event.', null, 422);
        }

        $now = now();
        $windowClosed = ($event->registration_starts_at && $now->lt($event->registration_starts_at))
            || ($event->registration_ends_at && $now->gt($event->registration_ends_at));

        if ($event->registration_status !== 'open' || $windowClosed) {
            return $this->error('Registration is closed for this event.', null, 422);
        }

        $activeCount = $event->registrations()->where('status', '!=', 'cancelled')->count();
        if ($event->capacity !== null && $activeCount >= $event->capacity) {
            return $this->error('This event has reached its maximum capacity.', null, 422);
        }

        $alreadyRegistered = $event->registrations()
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)->orWhere('email', $user->email);
            })
            ->exists();

        if ($alreadyRegistered) {
            return $this->error('You are already registered for this event.', null, 422);
        }

        // A unique (event_id, email) constraint means a previously
        // cancelled registration must be reactivated, not re-created.
        $cancelled = $event->registrations()
            ->where('status', 'cancelled')
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)->orWhere('email', $user->email);
            })
            ->first();

        if ($cancelled) {
            $cancelled->fill([
                'user_id' => $user->id,
                'status' => 'pending',
                'registered_at' => $now,
                'cancelled_at' => null,
            ])->save();
            $registration = $cancelled;
        } else {
            $registration = $event->registrations()->create([
                'user_id' => $user->id,
                'registration_reference' => (string) Str::uuid(),
                'full_name' => trim($user->first_name.' '.$user->last_name),
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => 'pending',
                'registered_at' => $now,
            ]);
        }

        return $this->success(
            new EventRegistrationResource($registration),
            'Registered for the event successfully.',
            201,
        );
    }
}

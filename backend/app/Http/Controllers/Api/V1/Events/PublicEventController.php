<?php

namespace App\Http\Controllers\Api\V1\Events;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Events\PublicEventDetailResource;
use App\Http\Resources\Api\V1\Events\PublicEventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public read-only events. Draft and cancelled events are never exposed;
 * registration details of other users are never returned (aggregate
 * counts only).
 */
class PublicEventController extends BaseController
{
    /** Statuses visible on the public site. */
    private const PUBLIC_STATUSES = ['upcoming', 'ongoing', 'completed'];

    /** GET /api/v1/public/events?page=&per_page=&status= */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer'],
            // Comma-separated list of public lifecycle filters.
            'status' => ['sometimes', 'string'],
        ]);

        $statuses = self::PUBLIC_STATUSES;
        if (! empty($validated['status'])) {
            $requested = array_intersect(
                array_map('trim', explode(',', $validated['status'])),
                self::PUBLIC_STATUSES,
            );
            if ($requested === []) {
                return $this->error('Invalid status filter.', null, 422);
            }
            $statuses = array_values($requested);
        }

        $perPage = min(24, max(1, (int) ($validated['per_page'] ?? 9)));

        // Completed listings read best newest-first; anything upcoming
        // reads best soonest-first.
        $direction = $statuses === ['completed'] ? 'desc' : 'asc';

        $paginator = $this->baseQuery($request)
            ->whereIn('status', $statuses)
            ->orderBy('starts_at', $direction)
            ->orderBy('id', $direction)
            ->paginate(perPage: $perPage, page: (int) ($validated['page'] ?? 1));

        return response()->json([
            'success' => true,
            'message' => 'Events retrieved successfully.',
            'data' => PublicEventResource::collection($paginator->items()),
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

    /** GET /api/v1/public/events/{event} */
    public function show(Request $request, int $event): JsonResponse
    {
        $model = $this->baseQuery($request)
            ->whereIn('status', self::PUBLIC_STATUSES)
            ->find($event);

        abort_if($model === null, 404);

        return $this->success(
            new PublicEventDetailResource($model),
            'Event retrieved successfully.',
        );
    }

    /**
     * Common scoping: aggregate active-registration count, plus a
     * per-user `is_registered` flag when a valid bearer token is present
     * (the endpoint itself stays public).
     */
    private function baseQuery(Request $request)
    {
        $query = Event::query()->withCount([
            'registrations as active_registrations_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
        ]);

        $user = auth('sanctum')->user();
        if ($user !== null) {
            $query->withExists([
                'registrations as is_registered' => fn ($q) => $q
                    ->where('status', '!=', 'cancelled')
                    ->where(fn ($inner) => $inner
                        ->where('user_id', $user->id)
                        ->orWhere('email', $user->email)),
            ]);
        }

        return $query;
    }
}

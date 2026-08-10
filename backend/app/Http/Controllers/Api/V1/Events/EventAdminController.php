<?php

namespace App\Http\Controllers\Api\V1\Events;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Events\ListEventsRequest;
use App\Http\Requests\Api\V1\Events\StoreEventRequest;
use App\Http\Requests\Api\V1\Events\UpdateEventRequest;
use App\Http\Resources\Api\V1\Events\AdminEventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventAdminController extends BaseController
{
    /** Count of seats taken (non-cancelled registrations). */
    private function activeCount(): array
    {
        return [
            'registrations as active_registrations_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
        ];
    }

    /** GET /api/v1/events */
    public function index(ListEventsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Event::class);

        $filters = $request->validated();

        $query = Event::query()->withCount($this->activeCount());

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("title_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("title_en like ? escape '\\'", [$like]);
            });
        }

        if (($location = trim((string) ($filters['location'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $location).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("location_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("location_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['registration_status'])) {
            $query->where('registration_status', $filters['registration_status']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('starts_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where('starts_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        $paginator = $query
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Events retrieved successfully.',
            'data' => AdminEventResource::collection($paginator->items()),
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

    /** GET /api/v1/events/{event} */
    public function show(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        return $this->success(
            new AdminEventResource($event->loadCount($this->activeCount())),
            'Event retrieved successfully.',
        );
    }

    /** POST /api/v1/events (multipart when an image is attached) */
    public function store(StoreEventRequest $request): JsonResponse
    {
        $this->authorize('create', Event::class);

        $input = $request->validated();

        $event = new Event($this->mappedAttributes($input));
        $event->created_by = $request->user()->id;
        $event->slug = $this->uniqueSlug($input['title_en']);
        $event->registration_required = true;

        if ($request->hasFile('image')) {
            $event->cover_image_path = $request->file('image')->store('event-covers', 'public');
        }

        $event->save();

        return $this->success(
            new AdminEventResource($event->loadCount($this->activeCount())),
            'Event created successfully.',
            201,
        );
    }

    /** PUT /api/v1/events/{event} */
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $event->fill($this->mappedAttributes($request->validated()));

        if ($request->hasFile('image')) {
            $this->deleteCover($event);
            $event->cover_image_path = $request->file('image')->store('event-covers', 'public');
        } elseif ($request->boolean('remove_image')) {
            $this->deleteCover($event);
            $event->cover_image_path = null;
        }

        $event->save();

        return $this->success(
            new AdminEventResource($event->loadCount($this->activeCount())),
            'Event updated successfully.',
        );
    }

    /** PATCH /api/v1/events/{event}/publish — body {publish:boolean}, default true. */
    public function publish(Request $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $event->status = $request->boolean('publish', true) ? 'upcoming' : 'draft';
        $event->save();

        return $this->success(
            new AdminEventResource($event->loadCount($this->activeCount())),
            $event->status === 'upcoming'
                ? 'Event published successfully.'
                : 'Event unpublished successfully.',
        );
    }

    /** PATCH /api/v1/events/{event}/cancel — also closes registration. */
    public function cancel(Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $event->status = 'cancelled';
        $event->registration_status = 'closed';
        $event->save();

        return $this->success(
            new AdminEventResource($event->loadCount($this->activeCount())),
            'Event cancelled successfully.',
        );
    }

    /** DELETE /api/v1/events/{event} — soft delete; frees the stored image. */
    public function destroy(Event $event): JsonResponse
    {
        $this->authorize('delete', $event);

        $this->deleteCover($event);
        $event->cover_image_path = null;
        $event->save();
        $event->delete();

        return $this->success(null, 'Event deleted successfully.');
    }

    /** @return array<string, mixed> */
    private function mappedAttributes(array $input): array
    {
        $date = Carbon::parse($input['event_date'])->toDateString();

        $attributes = [
            'title_ar' => $input['title_ar'],
            'title_en' => $input['title_en'],
            'excerpt_ar' => $input['excerpt_ar'],
            'excerpt_en' => $input['excerpt_en'],
            'description_ar' => $input['description_ar'],
            'description_en' => $input['description_en'],
            'location_ar' => $input['location_ar'],
            'location_en' => $input['location_en'],
            'starts_at' => Carbon::parse($date.' '.$input['start_time']),
            'ends_at' => Carbon::parse($date.' '.$input['end_time']),
            'capacity' => (int) $input['max_participants'],
            'registration_status' => $input['registration_status'],
            'status' => $input['status'],
        ];

        // Only touch registration window fields the client actually sent
        // (the frontend always sends them; '' becomes null and clears).
        if (array_key_exists('registration_start_date', $input)) {
            $attributes['registration_starts_at'] = $input['registration_start_date'] !== null
                ? Carbon::parse($input['registration_start_date'])->startOfDay()
                : null;
        }
        if (array_key_exists('registration_end_date', $input)) {
            $attributes['registration_ends_at'] = $input['registration_end_date'] !== null
                ? Carbon::parse($input['registration_end_date'])->endOfDay()
                : null;
        }

        return $attributes;
    }

    private function uniqueSlug(string $titleEn): string
    {
        $base = Str::slug($titleEn) ?: 'event';
        $slug = $base;
        $suffix = 1;

        while (Event::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }

    private function deleteCover(Event $event): void
    {
        if ($event->cover_image_path) {
            Storage::disk('public')->delete($event->cover_image_path);
        }
    }
}

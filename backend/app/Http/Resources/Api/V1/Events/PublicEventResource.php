<?php

namespace App\Http\Resources\Api\V1\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public card view of an event. Never exposes internal/admin fields or
 * anything about other users' registrations beyond aggregate capacity.
 *
 * Expects the controller to eager-provide `active_registrations_count`
 * (withCount) and, when a Sanctum user is present, `is_registered`.
 */
class PublicEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeCount = (int) ($this->active_registrations_count ?? 0);
        $capacity = $this->capacity;

        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => (string) ($this->excerpt_ar ?? ''),
            'excerpt_en' => (string) ($this->excerpt_en ?? ''),
            'location_ar' => (string) ($this->location_ar ?? ''),
            'location_en' => (string) ($this->location_en ?? ''),
            'starts_at' => $this->starts_at?->toISOString(),
            'ends_at' => $this->ends_at?->toISOString(),
            'status' => $this->status,
            'image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'registration_required' => (bool) $this->registration_required,
            'registration_open' => $this->registrationIsOpen($activeCount),
            'capacity' => $capacity,
            'registered_count' => $activeCount,
            'available_spots' => $capacity !== null ? max(0, $capacity - $activeCount) : null,
            'is_registered' => (bool) ($this->is_registered ?? false),
        ];
    }

    /** Mirrors the server-side registration guards (advisory for the UI). */
    private function registrationIsOpen(int $activeCount): bool
    {
        if (! in_array($this->status, ['upcoming', 'ongoing'], true)) {
            return false;
        }
        if ($this->registration_status !== 'open') {
            return false;
        }
        $now = now();
        if ($this->registration_starts_at && $now->lt($this->registration_starts_at)) {
            return false;
        }
        if ($this->registration_ends_at && $now->gt($this->registration_ends_at)) {
            return false;
        }
        if ($this->capacity !== null && $activeCount >= $this->capacity) {
            return false;
        }

        return true;
    }
}

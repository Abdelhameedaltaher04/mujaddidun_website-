<?php

namespace App\Http\Resources\Api\V1\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape consumed by the admin Events Management frontend module.
 * Expects `active_registrations_count` to be loaded (non-cancelled).
 */
class AdminEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => $this->excerpt_ar ?? '',
            'excerpt_en' => $this->excerpt_en ?? '',
            'description_ar' => $this->description_ar ?? '',
            'description_en' => $this->description_en ?? '',
            'location_ar' => $this->location_ar ?? '',
            'location_en' => $this->location_en ?? '',
            'event_date' => $this->starts_at?->toDateString(),
            'start_time' => $this->starts_at?->format('H:i'),
            'end_time' => $this->ends_at?->format('H:i'),
            'max_participants' => $this->capacity ?? 0,
            'registration_start_date' => $this->registration_starts_at?->toDateString(),
            'registration_end_date' => $this->registration_ends_at?->toDateString(),
            'registration_status' => $this->registration_status,
            'status' => $this->status,
            'registrations_count' => (int) ($this->active_registrations_count ?? 0),
            'image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

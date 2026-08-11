<?php

namespace App\Http\Resources\Api\V1\Programs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public card view of a program. Never exposes internal/admin fields or
 * other participants' private data — aggregate counts only.
 *
 * Expects the controller to provide `active_participants_count`
 * (withCount) and, when a Sanctum user is present, `is_participating`.
 */
class PublicProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeCount = (int) ($this->active_participants_count ?? 0);
        $capacity = $this->capacity;

        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => (string) ($this->summary_ar ?? ''),
            'excerpt_en' => (string) ($this->summary_en ?? ''),
            'category' => $this->category,
            'target_audience_ar' => (string) ($this->target_audience_ar ?? ''),
            'target_audience_en' => (string) ($this->target_audience_en ?? ''),
            'location_ar' => (string) ($this->location_ar ?? ''),
            'location_en' => (string) ($this->location_en ?? ''),
            'start_date' => $this->starts_on?->toDateString(),
            'end_date' => $this->ends_on?->toDateString(),
            'status' => $this->status,
            'image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'participation_open' => $this->participationIsOpen($activeCount),
            'capacity' => $capacity,
            'participants_count' => $activeCount,
            'available_spots' => $capacity !== null ? max(0, $capacity - $activeCount) : null,
            'is_participating' => (bool) ($this->is_participating ?? false),
        ];
    }

    /** Mirrors the server-side participation guards (advisory for the UI). */
    private function participationIsOpen(int $activeCount): bool
    {
        if ($this->status !== 'active') {
            return false;
        }
        if ($this->capacity !== null && $activeCount >= $this->capacity) {
            return false;
        }

        return true;
    }
}

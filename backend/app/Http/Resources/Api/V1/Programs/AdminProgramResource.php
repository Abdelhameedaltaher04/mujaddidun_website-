<?php

namespace App\Http\Resources\Api\V1\Programs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape consumed by the admin Programs Management frontend module.
 * Expects `active_participants_count` to be loaded (non-rejected).
 */
class AdminProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => $this->summary_ar ?? '',
            'excerpt_en' => $this->summary_en ?? '',
            'description_ar' => $this->description_ar ?? '',
            'description_en' => $this->description_en ?? '',
            'category' => $this->category,
            'target_audience_ar' => $this->target_audience_ar ?? '',
            'target_audience_en' => $this->target_audience_en ?? '',
            'location_ar' => $this->location_ar ?? '',
            'location_en' => $this->location_en ?? '',
            'start_date' => $this->starts_on?->toDateString(),
            'end_date' => $this->ends_on?->toDateString(),
            'max_participants' => $this->capacity ?? 0,
            'objectives_ar' => $this->objectives_ar ?? '',
            'objectives_en' => $this->objectives_en ?? '',
            'requirements_ar' => $this->requirements_ar ?? '',
            'requirements_en' => $this->requirements_en ?? '',
            'status' => $this->status,
            'participants_count' => (int) ($this->active_participants_count ?? 0),
            'image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

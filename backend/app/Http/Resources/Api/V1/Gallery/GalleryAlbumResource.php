<?php

namespace App\Http\Resources\Api\V1\Gallery;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape consumed by the admin Gallery Management frontend module.
 * Expects `images_count` to be loaded.
 */
class GalleryAlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'description_ar' => $this->description_ar ?? '',
            'description_en' => $this->description_en ?? '',
            'status' => $this->status,
            'cover_image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'images_count' => (int) ($this->images_count ?? 0),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

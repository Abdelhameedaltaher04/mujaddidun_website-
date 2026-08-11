<?php

namespace App\Http\Resources\Api\V1\Gallery;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public card/detail view of a published gallery album.
 * Never exposes admin/internal fields (creator, sort order, soft-delete state).
 *
 * Expects the controller to provide `images_count` via withCount.
 */
class PublicGalleryAlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'description_ar' => (string) ($this->description_ar ?? ''),
            'description_en' => (string) ($this->description_en ?? ''),
            'cover_image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'images_count' => (int) ($this->images_count ?? 0),
            'published_at' => $this->published_at?->toISOString(),
        ];
    }
}

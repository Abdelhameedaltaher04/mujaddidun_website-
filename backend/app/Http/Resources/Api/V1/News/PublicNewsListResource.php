<?php

namespace App\Http\Resources\Api\V1\News;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public list card for a published news article. Deliberately excludes
 * full content, status, author internals, and timestamps other than the
 * publication date.
 */
class PublicNewsListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => (string) ($this->excerpt_ar ?? ''),
            'excerpt_en' => (string) ($this->excerpt_en ?? ''),
            'category' => $this->category?->slug,
            'featured_image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'published_at' => $this->published_at?->toISOString(),
        ];
    }
}

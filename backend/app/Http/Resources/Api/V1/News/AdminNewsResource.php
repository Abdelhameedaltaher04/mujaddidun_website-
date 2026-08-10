<?php

namespace App\Http\Resources\Api\V1\News;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape consumed by the admin News Management frontend module.
 *
 * `featured_image_url` is a relative /api/v1/files/... URL because the
 * browser reaches Laravel only through the routed /api path — the classic
 * /storage symlink URL never reaches this service in the preview proxy.
 */
class AdminNewsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => $this->excerpt_ar ?? '',
            'excerpt_en' => $this->excerpt_en ?? '',
            'content_ar' => $this->content_ar,
            'content_en' => $this->content_en,
            'category' => $this->category?->slug,
            'author' => $this->author_name
                ?? ($this->author ? trim($this->author->first_name.' '.$this->author->last_name) : ''),
            'status' => $this->status,
            'featured_image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

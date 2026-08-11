<?php

namespace App\Http\Resources\Api\V1\News;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * Public detail view of a published news article, including full bilingual
 * content, the public author display name, and related published articles.
 * Never exposes status, internal FKs, or admin timestamps.
 */
class PublicNewsDetailResource extends JsonResource
{
    public function __construct($resource, private readonly Collection $related)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'excerpt_ar' => (string) ($this->excerpt_ar ?? ''),
            'excerpt_en' => (string) ($this->excerpt_en ?? ''),
            'content_ar' => $this->content_ar,
            'content_en' => $this->content_en,
            'category' => $this->category?->slug,
            'author' => $this->author_name ?: null,
            'featured_image_url' => $this->cover_image_path
                ? '/api/v1/files/'.$this->cover_image_path
                : null,
            'published_at' => $this->published_at?->toISOString(),
            'related' => PublicNewsListResource::collection($this->related),
        ];
    }
}

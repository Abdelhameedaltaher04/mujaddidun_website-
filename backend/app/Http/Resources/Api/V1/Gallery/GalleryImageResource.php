<?php

namespace App\Http\Resources\Api\V1\Gallery;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'album_id' => $this->gallery_album_id,
            'url' => '/api/v1/files/'.$this->file_path,
            'title_ar' => $this->title_ar ?? '',
            'title_en' => $this->title_en ?? '',
            'alt_ar' => $this->alt_text_ar ?? '',
            'alt_en' => $this->alt_text_en ?? '',
            'caption_ar' => $this->caption_ar ?? '',
            'caption_en' => $this->caption_en ?? '',
            'is_cover' => (bool) $this->is_cover,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

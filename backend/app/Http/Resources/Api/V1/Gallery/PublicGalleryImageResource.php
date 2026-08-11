<?php

namespace App\Http\Resources\Api\V1\Gallery;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Public view of a gallery image: URL, bilingual alt text and captions only. */
class PublicGalleryImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => '/api/v1/files/'.$this->file_path,
            'title_ar' => (string) ($this->title_ar ?? ''),
            'title_en' => (string) ($this->title_en ?? ''),
            'alt_ar' => (string) ($this->alt_text_ar ?? ''),
            'alt_en' => (string) ($this->alt_text_en ?? ''),
            'caption_ar' => (string) ($this->caption_ar ?? ''),
            'caption_en' => (string) ($this->caption_en ?? ''),
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}

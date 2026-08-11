<?php

namespace App\Http\Resources\Api\V1\News;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\NewsImage */
class NewsImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image' => '/api/v1/files/'.$this->image,
            'alt_text_ar' => $this->alt_text_ar ?? '',
            'alt_text_en' => $this->alt_text_en ?? '',
            'display_order' => $this->display_order,
        ];
    }
}

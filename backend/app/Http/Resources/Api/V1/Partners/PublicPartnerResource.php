<?php

namespace App\Http\Resources\Api\V1\Partners;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Public view of an active partner. No admin/internal fields (status, sort, timestamps). */
class PublicPartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'logo_url' => $this->logo_path
                ? '/api/v1/files/'.$this->logo_path
                : null,
            'website_url' => $this->website_url,
            'description_ar' => (string) ($this->description_ar ?? ''),
            'description_en' => (string) ($this->description_en ?? ''),
        ];
    }
}

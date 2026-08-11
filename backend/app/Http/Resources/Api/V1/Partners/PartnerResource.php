<?php

namespace App\Http\Resources\Api\V1\Partners;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Shape consumed by the admin Partners Management frontend module. */
class PartnerResource extends JsonResource
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
            'type' => $this->type,
            'website_url' => $this->website_url,
            'description_ar' => $this->description_ar ?? '',
            'description_en' => $this->description_en ?? '',
            'display_order' => (int) $this->sort_order,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

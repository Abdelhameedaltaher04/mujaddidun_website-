<?php

namespace App\Http\Resources\Api\V1\Events;

use Illuminate\Http\Request;

/** Public detail view: card fields plus the full bilingual description. */
class PublicEventDetailResource extends PublicEventResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description_ar' => (string) ($this->description_ar ?? ''),
            'description_en' => (string) ($this->description_en ?? ''),
        ]);
    }
}

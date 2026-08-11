<?php

namespace App\Http\Resources\Api\V1\Programs;

use Illuminate\Http\Request;

/** Public detail view: card fields plus full description, objectives, requirements. */
class PublicProgramDetailResource extends PublicProgramResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description_ar' => (string) ($this->description_ar ?? ''),
            'description_en' => (string) ($this->description_en ?? ''),
            'objectives_ar' => (string) ($this->objectives_ar ?? ''),
            'objectives_en' => (string) ($this->objectives_en ?? ''),
            'requirements_ar' => (string) ($this->requirements_ar ?? ''),
            'requirements_en' => (string) ($this->requirements_en ?? ''),
        ]);
    }
}

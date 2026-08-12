<?php

namespace App\Http\Resources\Api\V1\Faqs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Public view of a published FAQ. No admin/internal fields (status, timestamps). */
class PublicFaqResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_ar' => $this->question_ar,
            'question_en' => $this->question_en,
            'answer_ar' => $this->answer_ar,
            'answer_en' => $this->answer_en,
            'category' => $this->category,
            'display_order' => $this->sort_order,
        ];
    }
}

<?php

namespace App\Http\Resources\Api\V1\Faqs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Shape consumed by the admin FAQ Management frontend module. */
class FaqResource extends JsonResource
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
            'display_order' => (int) $this->sort_order,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

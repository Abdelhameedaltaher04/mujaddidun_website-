<?php

namespace App\Http\Requests\Api\V1\Faqs;

use App\Http\Requests\ApiFormRequest;

class StoreFaqRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'question_ar' => ['required', 'string', 'max:300'],
            'question_en' => ['required', 'string', 'max:300'],
            'answer_ar' => ['required', 'string', 'max:2000'],
            'answer_en' => ['required', 'string', 'max:2000'],
            'category' => ['sometimes', 'nullable', 'in:general,membership,programs,events,donations'],
            'display_order' => ['required', 'integer', 'min:1', 'max:100000'],
            'status' => ['required', 'in:draft,published,archived'],
        ];
    }
}

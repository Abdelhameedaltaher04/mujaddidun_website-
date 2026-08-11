<?php

namespace App\Http\Requests\Api\V1\Faqs;

use App\Http\Requests\ApiFormRequest;

class ListFaqsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:300'],
            'category' => ['sometimes', 'nullable', 'in:general,membership,programs,events,donations'],
            'status' => ['sometimes', 'nullable', 'in:draft,published,archived'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ];
    }
}

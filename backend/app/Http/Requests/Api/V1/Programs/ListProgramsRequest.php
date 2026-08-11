<?php

namespace App\Http\Requests\Api\V1\Programs;

use App\Http\Requests\ApiFormRequest;

class ListProgramsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'category' => ['sometimes', 'nullable', 'in:education,health,community,environment,youth,relief'],
            'status' => ['sometimes', 'nullable', 'in:draft,active,completed,archived'],
            'date_from' => ['sometimes', 'nullable', 'date'],
            'date_to' => ['sometimes', 'nullable', 'date'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

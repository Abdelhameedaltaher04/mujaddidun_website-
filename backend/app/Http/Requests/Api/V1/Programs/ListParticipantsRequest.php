<?php

namespace App\Http\Requests\Api\V1\Programs;

use App\Http\Requests\ApiFormRequest;

class ListParticipantsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'status' => ['sometimes', 'nullable', 'in:pending,approved,rejected,completed'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

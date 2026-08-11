<?php

namespace App\Http\Requests\Api\V1\Partners;

use App\Http\Requests\ApiFormRequest;

class ListPartnersRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'type' => ['sometimes', 'nullable', 'in:strategic,sponsor,media,community,academic'],
            'status' => ['sometimes', 'nullable', 'in:active,inactive'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ];
    }
}

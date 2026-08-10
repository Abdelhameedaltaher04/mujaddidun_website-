<?php

namespace App\Http\Requests\Api\V1\Events;

use App\Http\Requests\ApiFormRequest;

class ListEventsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'status' => ['sometimes', 'nullable', 'in:draft,upcoming,ongoing,completed,cancelled'],
            'registration_status' => ['sometimes', 'nullable', 'in:open,closed'],
            'location' => ['sometimes', 'nullable', 'string', 'max:120'],
            'date_from' => ['sometimes', 'nullable', 'date'],
            'date_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:date_from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

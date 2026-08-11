<?php

namespace App\Http\Requests\Api\V1\Volunteers;

use App\Http\Requests\ApiFormRequest;

class ListVolunteerApplicationsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'nullable', 'in:pending,under_review,approved,rejected,withdrawn'],
            'program_id' => ['sometimes', 'nullable', 'integer', 'exists:programs,id'],
            // Lenient on purpose: the UI's native date inputs fire requests
            // mid-selection (partial years, inverted ranges). Anything that
            // is not a complete Y-m-d date is ignored by the controller.
            'date_from' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_to' => ['sometimes', 'nullable', 'string', 'max:20'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Http\Requests\ApiFormRequest;

class ListUsersRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:120'],
            'role' => ['sometimes', 'nullable', 'string', 'exists:roles,slug'],
            'status' => ['sometimes', 'nullable', 'in:active,suspended'],
            'verified' => ['sometimes', 'nullable', 'in:verified,unverified'],
            'registered_from' => ['sometimes', 'nullable', 'date'],
            'registered_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:registered_from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

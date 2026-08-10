<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Http\Requests\ApiFormRequest;

class UpdateUserRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['present', 'nullable', 'string', 'max:32'],
            'country_code' => ['sometimes', 'nullable', 'string', 'size:2'],
            'role' => ['required', 'string', 'exists:roles,slug'],
            // The admin UI status contract is active|suspended only.
            'status' => ['required', 'in:active,suspended'],
        ];
    }
}

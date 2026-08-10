<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Http\Requests\ApiFormRequest;

class UpdateUserRoleRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', 'exists:roles,slug'],
        ];
    }
}

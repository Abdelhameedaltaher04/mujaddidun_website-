<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Http\Requests\ApiFormRequest;

class UpdateUserStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            // The admin UI status contract is active|suspended only.
            'status' => ['required', 'in:active,suspended'],
        ];
    }
}

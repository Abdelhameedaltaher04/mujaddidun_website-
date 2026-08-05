<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', Password::defaults()],
            'password_confirmation' => ['required', 'same:new_password'],
        ];
    }
}
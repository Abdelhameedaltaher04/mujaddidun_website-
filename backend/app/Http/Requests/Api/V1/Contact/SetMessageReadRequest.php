<?php

namespace App\Http\Requests\Api\V1\Contact;

use App\Http\Requests\ApiFormRequest;

class SetMessageReadRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'is_read' => ['required', 'boolean'],
        ];
    }
}

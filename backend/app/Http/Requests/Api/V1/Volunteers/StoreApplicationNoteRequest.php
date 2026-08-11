<?php

namespace App\Http\Requests\Api\V1\Volunteers;

use App\Http\Requests\ApiFormRequest;

class StoreApplicationNoteRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:1000'],
        ];
    }
}

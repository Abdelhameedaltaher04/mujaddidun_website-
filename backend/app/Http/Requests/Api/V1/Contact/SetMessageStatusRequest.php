<?php

namespace App\Http\Requests\Api\V1\Contact;

use App\Http\Requests\ApiFormRequest;

class SetMessageStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            // Archiving goes through the dedicated /archive endpoint.
            'status' => ['required', 'in:new,in_progress,resolved'],
        ];
    }
}

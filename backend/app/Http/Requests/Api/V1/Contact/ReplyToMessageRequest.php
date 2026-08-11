<?php

namespace App\Http\Requests\Api\V1\Contact;

use App\Http\Requests\ApiFormRequest;

class ReplyToMessageRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:200'],
            'body_html' => ['required', 'string', 'max:50000'],
        ];
    }
}

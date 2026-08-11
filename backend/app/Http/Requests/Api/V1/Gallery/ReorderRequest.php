<?php

namespace App\Http\Requests\Api\V1\Gallery;

use App\Http\Requests\ApiFormRequest;

/** Body: { order: [id, id, ...] } — full desired ordering. */
class ReorderRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['required', 'integer', 'distinct'],
        ];
    }
}

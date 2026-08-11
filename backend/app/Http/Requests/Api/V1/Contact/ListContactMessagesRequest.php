<?php

namespace App\Http\Requests\Api\V1\Contact;

use App\Http\Requests\ApiFormRequest;

class ListContactMessagesRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        // Axios serializes booleans as the strings "true"/"false".
        if ($this->has('read')) {
            $this->merge(['read' => filter_var($this->query('read'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)]);
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'read' => ['sometimes', 'nullable', 'boolean'],
            'status' => ['sometimes', 'nullable', 'in:new,in_progress,resolved,archived'],
            // Lenient on purpose: the UI's native date inputs fire requests
            // mid-selection; incomplete values are ignored by the controller.
            'date_from' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_to' => ['sometimes', 'nullable', 'string', 'max:20'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

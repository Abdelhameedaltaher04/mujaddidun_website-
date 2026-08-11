<?php

namespace App\Http\Requests\Api\V1\Donations;

use App\Http\Requests\ApiFormRequest;

class ListDonationsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'status' => ['sometimes', 'nullable', 'in:pending,completed,failed,refunded,cancelled'],
            'method' => ['sometimes', 'nullable', 'in:card,bank_transfer,paypal,cash'],
            // Lenient on purpose: the UI's native date inputs fire requests
            // mid-selection (partial years, inverted ranges). Anything that
            // is not a complete Y-m-d date is ignored by the controller
            // rather than rejected with a 422.
            'date_from' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_to' => ['sometimes', 'nullable', 'string', 'max:20'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:500'],
        ];
    }
}

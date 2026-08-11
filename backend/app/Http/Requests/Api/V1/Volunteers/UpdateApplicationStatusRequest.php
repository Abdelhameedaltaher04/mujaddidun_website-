<?php

namespace App\Http\Requests\Api\V1\Volunteers;

use App\Http\Requests\ApiFormRequest;

class UpdateApplicationStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:under_review,approved,rejected,withdrawn'],
            'rejection_reason' => [
                'required_if:status,rejected',
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required_if' => 'A rejection reason is required when rejecting an application.',
        ];
    }
}

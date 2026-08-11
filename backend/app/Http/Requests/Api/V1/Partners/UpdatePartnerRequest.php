<?php

namespace App\Http\Requests\Api\V1\Partners;

/** Same rules as create, except the logo is optional (kept when absent). */
class UpdatePartnerRequest extends StorePartnerRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['logo'][0] = 'sometimes';
        array_splice($rules['logo'], 1, 0, ['nullable']);

        return $rules;
    }
}

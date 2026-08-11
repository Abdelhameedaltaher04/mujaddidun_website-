<?php

namespace App\Http\Requests\Api\V1\Partners;

use App\Http\Requests\ApiFormRequest;

class StorePartnerRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'name_ar' => ['required', 'string', 'max:150'],
            'name_en' => ['required', 'string', 'max:150'],
            'type' => ['required', 'in:strategic,sponsor,media,community,academic'],
            'website_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'description_ar' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'display_order' => ['required', 'integer', 'min:1', 'max:100000'],
            'status' => ['required', 'in:active,inactive'],
            'logo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,svg',
                'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml',
                'max:5120',
            ],
        ];
    }
}

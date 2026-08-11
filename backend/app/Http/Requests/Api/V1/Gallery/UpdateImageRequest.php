<?php

namespace App\Http\Requests\Api\V1\Gallery;

use App\Http\Requests\ApiFormRequest;

class UpdateImageRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['sometimes', 'nullable', 'string', 'max:150'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:150'],
            'alt_ar' => ['required', 'string', 'max:255'],
            'alt_en' => ['required', 'string', 'max:255'],
            'caption_ar' => ['sometimes', 'nullable', 'string', 'max:500'],
            'caption_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}

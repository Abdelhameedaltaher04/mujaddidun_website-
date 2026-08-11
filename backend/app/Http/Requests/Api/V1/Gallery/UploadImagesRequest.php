<?php

namespace App\Http\Requests\Api\V1\Gallery;

use App\Http\Requests\ApiFormRequest;

/**
 * Multi-file upload: parallel arrays images[i] / alt_ar[i] / alt_en[i].
 * Alt text is required for accessibility.
 */
class UploadImagesRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:20'],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'alt_ar' => ['required', 'array'],
            'alt_ar.*' => ['required', 'string', 'max:255'],
            'alt_en' => ['required', 'array'],
            'alt_en.*' => ['required', 'string', 'max:255'],
        ];
    }
}

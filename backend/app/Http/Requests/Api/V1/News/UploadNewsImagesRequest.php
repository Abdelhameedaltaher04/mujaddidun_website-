<?php

namespace App\Http\Requests\Api\V1\News;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Multipart arrays: images[] plus optional parallel alt_ar[] / alt_en[].
 */
class UploadNewsImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy enforced in the controller
    }

    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:20'],
            'images.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'alt_ar' => ['sometimes', 'array'],
            'alt_ar.*' => ['nullable', 'string', 'max:255'],
            'alt_en' => ['sometimes', 'array'],
            'alt_en.*' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Content;

use App\Http\Requests\ApiFormRequest;

/** Shared by POST /content/ctas and PUT /content/ctas/{id} (multipart). */
class StoreCtaSectionRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage', \App\Models\WebsiteSetting::class);
    }

    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:200'],
            'title_en' => ['required', 'string', 'max:200'],
            'description_ar' => ['present', 'nullable', 'string', 'max:1000'],
            'description_en' => ['present', 'nullable', 'string', 'max:1000'],
            'button_text_ar' => ['present', 'nullable', 'string', 'max:100'],
            'button_text_en' => ['present', 'nullable', 'string', 'max:100'],
            'button_url' => ['present', 'nullable', 'string', 'max:500'],
            'is_active' => ['required', 'boolean'],
            'image' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}

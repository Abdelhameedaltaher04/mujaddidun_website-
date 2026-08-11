<?php

namespace App\Http\Requests\Api\V1\Gallery;

use App\Http\Requests\ApiFormRequest;

class StoreAlbumRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:150'],
            'title_en' => ['required', 'string', 'max:150'],
            'description_ar' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description_en' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['required', 'in:draft,published,archived'],
            'cover_image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_cover' => ['sometimes', 'boolean'],
        ];
    }
}

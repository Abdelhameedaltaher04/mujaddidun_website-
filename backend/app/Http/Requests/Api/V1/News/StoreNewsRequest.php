<?php

namespace App\Http\Requests\Api\V1\News;

use App\Http\Requests\ApiFormRequest;

class StoreNewsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:150'],
            'title_en' => ['required', 'string', 'max:150'],
            'excerpt_ar' => ['required', 'string', 'max:300'],
            'excerpt_en' => ['required', 'string', 'max:300'],
            'content_ar' => ['required', 'string'],
            'content_en' => ['required', 'string'],
            'category' => ['required', 'string', 'exists:news_categories,slug'],
            'author' => ['required', 'string', 'max:150'],
            'status' => ['required', 'in:draft,published,archived'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'featured_image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_featured_image' => ['sometimes', 'boolean'],
        ];
    }
}

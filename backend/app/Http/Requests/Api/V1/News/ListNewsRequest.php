<?php

namespace App\Http\Requests\Api\V1\News;

use App\Http\Requests\ApiFormRequest;

class ListNewsRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:150'],
            'category' => ['sometimes', 'nullable', 'string', 'exists:news_categories,slug'],
            'status' => ['sometimes', 'nullable', 'in:draft,published,archived'],
            'published_from' => ['sometimes', 'nullable', 'date'],
            'published_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:published_from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

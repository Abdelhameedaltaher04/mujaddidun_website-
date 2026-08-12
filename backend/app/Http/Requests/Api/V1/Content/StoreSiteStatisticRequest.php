<?php

namespace App\Http\Requests\Api\V1\Content;

use App\Http\Requests\ApiFormRequest;

/** Shared by POST /content/statistics and PUT /content/statistics/{id}. */
class StoreSiteStatisticRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage', \App\Models\WebsiteSetting::class);
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:20'],
            'label_ar' => ['required', 'string', 'max:200'],
            'label_en' => ['required', 'string', 'max:200'],
            'icon' => ['present', 'nullable', 'string', 'max:50'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}

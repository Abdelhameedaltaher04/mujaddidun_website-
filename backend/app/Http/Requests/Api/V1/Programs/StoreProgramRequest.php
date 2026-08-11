<?php

namespace App\Http\Requests\Api\V1\Programs;

use App\Http\Requests\ApiFormRequest;

class StoreProgramRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:150'],
            'title_en' => ['required', 'string', 'max:150'],
            'excerpt_ar' => ['required', 'string', 'max:300'],
            'excerpt_en' => ['required', 'string', 'max:300'],
            'description_ar' => ['required', 'string'],
            'description_en' => ['required', 'string'],
            'category' => ['required', 'in:education,health,community,environment,youth,relief'],
            'target_audience_ar' => ['required', 'string', 'max:150'],
            'target_audience_en' => ['required', 'string', 'max:150'],
            'location_ar' => ['required', 'string', 'max:120'],
            'location_en' => ['required', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'max_participants' => ['required', 'integer', 'min:1', 'max:100000'],
            'objectives_ar' => ['required', 'string'],
            'objectives_en' => ['required', 'string'],
            'requirements_ar' => ['required', 'string'],
            'requirements_en' => ['required', 'string'],
            'status' => ['required', 'in:draft,active,completed,archived'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}

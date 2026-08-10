<?php

namespace App\Http\Requests\Api\V1\Events;

use App\Http\Requests\ApiFormRequest;

class StoreEventRequest extends ApiFormRequest
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
            'location_ar' => ['required', 'string', 'max:120'],
            'location_en' => ['required', 'string', 'max:120'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'max_participants' => ['required', 'integer', 'min:1', 'max:100000'],
            'registration_start_date' => ['sometimes', 'nullable', 'date'],
            'registration_end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:registration_start_date'],
            'registration_status' => ['required', 'in:open,closed'],
            'status' => ['required', 'in:draft,upcoming,ongoing,completed,cancelled'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Content;

use App\Http\Requests\ApiFormRequest;

/**
 * Validation for PUT /content/{section}; the rule set is chosen by the
 * route's {section} parameter. Image uploads exclude SVG (content images
 * are photographic; keeps the stored-XSS surface closed).
 */
class UpdateContentSectionRequest extends ApiFormRequest
{
    /** Authorization must precede validation (403 before 422). */
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage', \App\Models\WebsiteSetting::class);
    }

    private const IMAGE_RULES = ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

    public function rules(): array
    {
        return match ($this->route('section')) {
            'hero' => [
                'title_ar' => ['required', 'string', 'max:200'],
                'title_en' => ['required', 'string', 'max:200'],
                'description_ar' => ['present', 'nullable', 'string', 'max:1000'],
                'description_en' => ['present', 'nullable', 'string', 'max:1000'],
                'primary_button_text_ar' => ['present', 'nullable', 'string', 'max:100'],
                'primary_button_text_en' => ['present', 'nullable', 'string', 'max:100'],
                'primary_button_url' => ['present', 'nullable', 'string', 'max:500'],
                'secondary_button_text_ar' => ['present', 'nullable', 'string', 'max:100'],
                'secondary_button_text_en' => ['present', 'nullable', 'string', 'max:100'],
                'secondary_button_url' => ['present', 'nullable', 'string', 'max:500'],
                'is_active' => ['required', 'boolean'],
                'background_image' => self::IMAGE_RULES,
                'remove_background_image' => ['sometimes', 'boolean'],
            ],
            'about' => [
                'title_ar' => ['required', 'string', 'max:200'],
                'title_en' => ['required', 'string', 'max:200'],
                'description_ar' => ['required', 'string', 'max:3000'],
                'description_en' => ['required', 'string', 'max:3000'],
                'is_active' => ['required', 'boolean'],
                'image' => self::IMAGE_RULES,
                'remove_image' => ['sometimes', 'boolean'],
            ],
            'vision_mission' => [
                'vision_ar' => ['required', 'string', 'max:2000'],
                'vision_en' => ['required', 'string', 'max:2000'],
                'mission_ar' => ['required', 'string', 'max:2000'],
                'mission_en' => ['required', 'string', 'max:2000'],
                'is_active' => ['required', 'boolean'],
            ],
            'footer' => [
                'description_ar' => ['required', 'string', 'max:500'],
                'description_en' => ['required', 'string', 'max:500'],
                'copyright_ar' => ['required', 'string', 'max:300'],
                'copyright_en' => ['required', 'string', 'max:300'],
            ],
            default => [],
        };
    }
}

<?php

namespace App\Http\Requests\Api\V1\Settings;

use App\Http\Requests\ApiFormRequest;

/**
 * Validation for every PUT /settings/{section} endpoint; the rule set is
 * chosen by the route's {section} parameter.
 */
class UpdateSettingsSectionRequest extends ApiFormRequest
{
    /** Authorization must precede validation (403 before 422). */
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('manage', \App\Models\WebsiteSetting::class);
    }


    private const IMAGE_RULES = ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'];

    private const PHONE_REGEX = 'regex:/^\+?[0-9][0-9\s\-()]{5,19}$/';

    public function rules(): array
    {
        return match ($this->route('section')) {
            'general' => [
                'site_name_ar' => ['required', 'string', 'max:200'],
                'site_name_en' => ['required', 'string', 'max:200'],
                'description_ar' => ['present', 'nullable', 'string', 'max:1000'],
                'description_en' => ['present', 'nullable', 'string', 'max:1000'],
                'logo' => self::IMAGE_RULES,
                'favicon' => self::IMAGE_RULES,
                'remove_logo' => ['sometimes', 'boolean'],
                'remove_favicon' => ['sometimes', 'boolean'],
            ],
            'contact' => [
                'phone' => ['required', 'string', 'max:30', self::PHONE_REGEX],
                'whatsapp' => ['present', 'nullable', 'string', 'max:30', self::PHONE_REGEX],
                'email' => ['required', 'email', 'max:255'],
                'address_ar' => ['present', 'nullable', 'string', 'max:500'],
                'address_en' => ['present', 'nullable', 'string', 'max:500'],
                'maps_url' => ['present', 'nullable', 'url:http,https', 'max:500'],
            ],
            'social' => $this->socialRules(),
            'branding' => [
                'website_title' => ['required', 'string', 'max:200'],
                'default_language' => ['required', 'in:ar,en'],
                'primary_logo' => self::IMAGE_RULES,
                'footer_logo' => self::IMAGE_RULES,
                'favicon' => self::IMAGE_RULES,
                'remove_primary_logo' => ['sometimes', 'boolean'],
                'remove_footer_logo' => ['sometimes', 'boolean'],
                'remove_favicon' => ['sometimes', 'boolean'],
            ],
            'seo' => [
                'meta_title_ar' => ['present', 'nullable', 'string', 'max:70'],
                'meta_title_en' => ['present', 'nullable', 'string', 'max:70'],
                'meta_description_ar' => ['present', 'nullable', 'string', 'max:160'],
                'meta_description_en' => ['present', 'nullable', 'string', 'max:160'],
                'keywords' => ['present', 'nullable', 'string', 'max:500'],
                'og_image' => self::IMAGE_RULES,
                'remove_og_image' => ['sometimes', 'boolean'],
            ],
            'email' => [
                'sender_name' => ['required', 'string', 'max:200'],
                'sender_email' => ['required', 'email', 'max:255'],
                'reply_to_email' => ['required', 'email', 'max:255'],
            ],
            'controls' => [
                'maintenance_mode' => ['required', 'boolean'],
                'allow_registrations' => ['required', 'boolean'],
                'allow_event_registrations' => ['required', 'boolean'],
                'allow_volunteer_applications' => ['required', 'boolean'],
                'show_donations' => ['required', 'boolean'],
                'show_partners' => ['required', 'boolean'],
                'show_faqs' => ['required', 'boolean'],
            ],
            default => [],
        };
    }

    private function socialRules(): array
    {
        $rules = [];
        foreach (['facebook', 'instagram', 'linkedin', 'youtube'] as $platform) {
            $rules[$platform] = ['required', 'array'];
            $rules["{$platform}.enabled"] = ['required', 'boolean'];
            $rules["{$platform}.value"] = [
                "required_if:{$platform}.enabled,true", 'nullable', 'url:http,https', 'max:255',
            ];
        }
        $rules['whatsapp'] = ['required', 'array'];
        $rules['whatsapp.enabled'] = ['required', 'boolean'];
        $rules['whatsapp.value'] = [
            'required_if:whatsapp.enabled,true', 'nullable', 'string', 'max:30', self::PHONE_REGEX,
        ];

        return $rules;
    }
}

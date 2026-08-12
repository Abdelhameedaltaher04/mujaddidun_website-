<?php

namespace App\Http\Requests\Api\V1\Volunteers;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Unauthenticated public volunteer application. The client supplies only
 * applicant profile data and preferences — status, review fields, and
 * timestamps are set server-side. Interests/availability are constrained
 * to the fixed public-form option ids. A honeypot ("website" must stay
 * empty) plus route-level throttling filter naive bots.
 */
class StorePublicVolunteerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:200'],
            'date_of_birth' => ['required', 'date', 'before:today', 'after:1900-01-01'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s\-()]{5,19}$/'],
            'interests' => ['required', 'array', 'min:1'],
            'interests.*' => ['string', 'in:feeding,housing,empowerment,admin,media,events'],
            'availability' => ['required', 'array', 'min:1'],
            'availability.*' => ['string', 'in:morning,evening,weekends'],
            'experience' => ['nullable', 'string', 'max:5000'],
            // Honeypot: hidden field humans never fill.
            'website' => ['prohibited'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Contact;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Unauthenticated public contact form submission. Field-level validation
 * plus a honeypot ("website" must stay empty — bots fill every field).
 * Route-level throttling caps submission volume per IP.
 */
class StorePublicContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s\-()]{5,19}$/'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
            // Honeypot: hidden field humans never fill.
            'website' => ['prohibited'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Donations;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Unauthenticated public donation intent. The client may only supply donor
 * contact details and the pledge itself — status, currency, payment provider,
 * references, and timestamps are always set server-side (never trusted from
 * the client). A honeypot ("website" must stay empty) plus route-level
 * throttling filter naive bots.
 */
class StorePublicDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'donor_name' => ['nullable', 'string', 'max:200'],
            'donor_email' => ['nullable', 'email', 'max:255'],
            'donor_phone' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s\-()]{5,19}$/'],
            'amount' => ['required', 'numeric', 'min:1', 'max:999999.99'],
            'donation_type' => ['required', 'in:general,feeding,housing,empowerment,zakat'],
            'frequency' => ['required', 'in:once,monthly'],
            // Honeypot: hidden field humans never fill.
            'website' => ['prohibited'],
        ];
    }
}

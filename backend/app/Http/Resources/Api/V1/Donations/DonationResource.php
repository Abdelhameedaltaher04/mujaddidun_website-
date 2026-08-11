<?php

namespace App\Http\Resources\Api\V1\Donations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape consumed by the admin Donations Management frontend module.
 *
 * Field mapping (frontend <- database):
 * - email/phone      <- donor_email/donor_phone
 * - method           <- payment_provider
 * - transaction_id   <- payment_reference
 * - status completed <- status 'paid'
 * - donated_at       <- created_at
 *
 * Only the fields the admin UI needs are exposed; no internal payment
 * credentials or provider payloads exist on this record by design.
 */
class DonationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'donor_name' => $this->donor_name ?? '',
            'email' => $this->donor_email ?? '',
            'phone' => $this->donor_phone,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'method' => $this->payment_provider,
            'transaction_id' => $this->payment_reference ?? '',
            'status' => $this->status === 'paid' ? 'completed' : $this->status,
            'notes' => $this->notes,
            'donated_at' => $this->created_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Donations;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Donations\StorePublicDonationRequest;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;

/**
 * Public donation intent endpoint (no auth). There is no online payment
 * gateway integrated yet, so donations are recorded as `pending` and are
 * confirmed by an admin (e.g. after a bank transfer arrives). Status,
 * currency, and payment fields are set exclusively server-side.
 */
class PublicDonationController extends BaseController
{
    public function store(StorePublicDonationRequest $request): JsonResponse
    {
        $donation = Donation::create([
            'user_id' => $request->user('sanctum')?->id,
            'donor_name' => trim((string) $request->validated('donor_name')) ?: null,
            'donor_email' => trim((string) $request->validated('donor_email')) ?: null,
            'donor_phone' => trim($request->validated('donor_phone')),
            'amount' => $request->validated('amount'),
            'currency' => 'JOD',
            'donation_type' => $request->validated('donation_type'),
            'frequency' => $request->validated('frequency'),
            'status' => 'pending',
        ]);

        // Minimal public echo: reference number + what was pledged. No admin
        // fields, notes, or payment internals.
        return $this->success([
            'id' => $donation->id,
            'amount' => (float) $donation->amount,
            'currency' => $donation->currency,
            'donation_type' => $donation->donation_type,
            'frequency' => $donation->frequency,
            'status' => 'pending',
        ], 'تم استلام طلب التبرع بنجاح.', 201);
    }
}

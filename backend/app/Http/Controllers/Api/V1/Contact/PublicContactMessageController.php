<?php

namespace App\Http\Controllers\Api\V1\Contact;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Contact\StorePublicContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

/**
 * Public contact form endpoint (no auth). Rate limited at the route level;
 * spam is additionally filtered by a honeypot field in the request.
 */
class PublicContactMessageController extends BaseController
{
    public function store(StorePublicContactMessageRequest $request): JsonResponse
    {
        ContactMessage::create([
            'name' => trim($request->validated('name')),
            'email' => trim($request->validated('email')),
            'phone' => $request->validated('phone') ?: null,
            'subject' => trim($request->validated('subject')),
            'message' => $request->validated('message'),
            'status' => 'new',
            // created_at is the received timestamp (exposed as received_at).
        ]);

        return $this->success(null, 'تم إرسال رسالتك بنجاح.', 201);
    }
}

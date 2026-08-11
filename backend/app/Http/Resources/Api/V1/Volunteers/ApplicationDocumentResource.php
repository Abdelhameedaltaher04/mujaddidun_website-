<?php

namespace App\Http\Resources\Api\V1\Volunteers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

/**
 * Private volunteer documents. `url` is a short-lived relative signed URL
 * (the browser cannot attach bearer headers to <img>/<iframe>/download
 * links); the download route validates the signature. Signed URLs are
 * only ever generated for admins/moderators who passed the policy check.
 */
class ApplicationDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'file_type' => $this->mime_type,
            'url' => URL::temporarySignedRoute(
                'volunteer-documents.download',
                now()->addMinutes(30),
                ['document' => $this->id],
                absolute: false,
            ),
            'uploaded_at' => $this->uploaded_at?->toISOString(),
        ];
    }
}

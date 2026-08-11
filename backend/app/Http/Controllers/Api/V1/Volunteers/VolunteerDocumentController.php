<?php

namespace App\Http\Controllers\Api\V1\Volunteers;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\VolunteerApplicationDocument;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves private volunteer documents from local (non-public) storage.
 *
 * Access control: the route is protected by the `signed` middleware
 * (relative signatures). Signed URLs are short-lived and are only ever
 * generated inside ApplicationDocumentResource, which is only returned
 * to admins/moderators after a policy check. Documents are NEVER served
 * from a public disk or a guessable URL.
 */
class VolunteerDocumentController extends BaseController
{
    public function download(VolunteerApplicationDocument $document): BinaryFileResponse
    {
        $disk = Storage::disk('local');

        abort_unless($disk->exists($document->file_path), 404);

        return response()->file($disk->path($document->file_path), [
            'Content-Type' => $document->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->name).'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}

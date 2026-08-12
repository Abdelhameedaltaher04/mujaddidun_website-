<?php

namespace App\Http\Controllers\Api\V1\Faqs;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Faqs\PublicFaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;

/** Public read-only FAQs: published only, admin display order. */
class PublicFaqController extends BaseController
{
    /** GET /api/v1/public/faqs */
    public function index(): JsonResponse
    {
        $faqs = Faq::query()
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(
            PublicFaqResource::collection($faqs),
            'FAQs retrieved successfully.',
        );
    }

    /** GET /api/v1/public/faqs/{faq} — published only; drafts/archived 404. */
    public function show(int $faq): JsonResponse
    {
        $record = Faq::query()
            ->where('status', 'published')
            ->findOrFail($faq);

        return $this->success(
            new PublicFaqResource($record),
            'FAQ retrieved successfully.',
        );
    }
}

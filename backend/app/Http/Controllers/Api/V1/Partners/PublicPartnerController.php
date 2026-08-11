<?php

namespace App\Http\Controllers\Api\V1\Partners;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Partners\PublicPartnerResource;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;

/** Public read-only partners: active only, admin display order. */
class PublicPartnerController extends BaseController
{
    /** GET /api/v1/public/partners */
    public function index(): JsonResponse
    {
        $partners = Partner::query()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(
            PublicPartnerResource::collection($partners),
            'Partners retrieved successfully.',
        );
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Programs;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Programs\PublicProgramDetailResource;
use App\Http\Resources\Api\V1\Programs\PublicProgramResource;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public read-only programs. Draft and archived programs are never
 * exposed; participant PII is never returned (aggregate counts only).
 */
class PublicProgramController extends BaseController
{
    /** Statuses visible on the public site. */
    private const PUBLIC_STATUSES = ['active', 'completed'];

    private const CATEGORIES = ['education', 'health', 'community', 'environment', 'youth', 'relief'];

    /** GET /api/v1/public/programs?page=&per_page=&status=&category= */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string', 'in:active,completed'],
            'category' => ['sometimes', 'string', 'in:'.implode(',', self::CATEGORIES)],
        ]);

        $perPage = min(24, max(1, (int) ($validated['per_page'] ?? 9)));

        $query = $this->baseQuery()
            ->whereIn('status', ! empty($validated['status']) ? [$validated['status']] : self::PUBLIC_STATUSES);

        if (! empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        $paginator = $query
            ->orderByRaw("case when status = 'active' then 0 else 1 end")
            ->orderByDesc('is_featured')
            ->orderByDesc('starts_on')
            ->orderByDesc('id')
            ->paginate(perPage: $perPage, page: (int) ($validated['page'] ?? 1));

        return response()->json([
            'success' => true,
            'message' => 'Programs retrieved successfully.',
            'data' => PublicProgramResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    /** GET /api/v1/public/programs/{program} */
    public function show(int $program): JsonResponse
    {
        $model = $this->baseQuery()
            ->whereIn('status', self::PUBLIC_STATUSES)
            ->find($program);

        abort_if($model === null, 404);

        return $this->success(
            new PublicProgramDetailResource($model),
            'Program retrieved successfully.',
        );
    }

    /**
     * Common scoping: aggregate active-participant count, plus a
     * per-user `is_participating` flag when a valid bearer token is
     * present (the endpoint itself stays public).
     */
    private function baseQuery()
    {
        $query = Program::query()->withCount([
            'participants as active_participants_count' => fn ($q) => $q->where('status', '!=', 'rejected'),
        ]);

        $user = auth('sanctum')->user();
        if ($user !== null) {
            $query->withExists([
                'participants as is_participating' => fn ($q) => $q
                    ->where('status', '!=', 'rejected')
                    ->where(fn ($inner) => $inner
                        ->where('user_id', $user->id)
                        ->orWhere('email', $user->email)),
            ]);
        }

        return $query;
    }
}

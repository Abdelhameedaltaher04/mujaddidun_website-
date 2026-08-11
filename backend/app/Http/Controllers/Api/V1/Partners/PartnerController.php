<?php

namespace App\Http\Controllers\Api\V1\Partners;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Partners\ListPartnersRequest;
use App\Http\Requests\Api\V1\Partners\StorePartnerRequest;
use App\Http\Requests\Api\V1\Partners\UpdatePartnerRequest;
use App\Http\Resources\Api\V1\Partners\PartnerResource;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PartnerController extends BaseController
{
    /** GET /api/v1/partners */
    public function index(ListPartnersRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Partner::class);

        $filters = $request->validated();

        $query = Partner::query();

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("name_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("name_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $paginator = $query
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Partners retrieved successfully.',
            'data' => PartnerResource::collection($paginator->items()),
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

    /** GET /api/v1/partners/{partner} */
    public function show(Partner $partner): JsonResponse
    {
        $this->authorize('view', $partner);

        return $this->success(new PartnerResource($partner), 'Partner retrieved successfully.');
    }

    /** POST /api/v1/partners (multipart; logo required) */
    public function store(StorePartnerRequest $request): JsonResponse
    {
        $this->authorize('create', Partner::class);

        $input = $request->validated();

        $partner = new Partner([
            'name_ar' => $input['name_ar'],
            'name_en' => $input['name_en'],
            'type' => $input['type'],
            'website_url' => $input['website_url'] ?? null,
            'description_ar' => $input['description_ar'] ?? null,
            'description_en' => $input['description_en'] ?? null,
            'sort_order' => (int) $input['display_order'],
            'status' => $input['status'],
        ]);
        $partner->slug = $this->uniqueSlug($input['name_en']);
        $partner->logo_path = $request->file('logo')->store('partner-logos', 'public');
        $partner->save();

        return $this->success(new PartnerResource($partner), 'Partner created successfully.', 201);
    }

    /** PUT /api/v1/partners/{partner} (multipart via _method=PUT) */
    public function update(UpdatePartnerRequest $request, Partner $partner): JsonResponse
    {
        $this->authorize('update', $partner);

        $input = $request->validated();

        $partner->fill([
            'name_ar' => $input['name_ar'],
            'name_en' => $input['name_en'],
            'type' => $input['type'],
            'website_url' => $input['website_url'] ?? null,
            'description_ar' => $input['description_ar'] ?? null,
            'description_en' => $input['description_en'] ?? null,
            'sort_order' => (int) $input['display_order'],
            'status' => $input['status'],
        ]);

        $oldLogo = null;
        if ($request->hasFile('logo')) {
            $oldLogo = $partner->logo_path;
            $partner->logo_path = $request->file('logo')->store('partner-logos', 'public');
        }

        $partner->save();

        // Free the replaced logo only after the new state is saved.
        if ($oldLogo) {
            Storage::disk('public')->delete($oldLogo);
        }

        return $this->success(new PartnerResource($partner), 'Partner updated successfully.');
    }

    /** PATCH /api/v1/partners/{partner}/status — body {status}. */
    public function setStatus(Request $request, Partner $partner): JsonResponse
    {
        $this->authorize('update', $partner);

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $partner->status = $validated['status'];
        $partner->save();

        return $this->success(new PartnerResource($partner), 'Partner status updated successfully.');
    }

    /**
     * PATCH /api/v1/partners/reorder — body {ids: [...]}.
     * The list must contain every partner exactly once; returns the
     * partners in their new order.
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('create', Partner::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $ids = $validated['ids'];
        $existing = Partner::pluck('id')->all();

        if (count($ids) !== count($existing) || array_diff($ids, $existing) !== []) {
            return $this->error('The order must list every partner exactly once.', null, 422);
        }

        DB::transaction(function () use ($ids): void {
            foreach ($ids as $position => $id) {
                Partner::whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });

        $partners = Partner::orderBy('sort_order')->orderBy('id')->get();

        return $this->success(
            PartnerResource::collection($partners),
            'Partners reordered successfully.',
        );
    }

    /** DELETE /api/v1/partners/{partner} — soft delete; frees the logo. */
    public function destroy(Partner $partner): JsonResponse
    {
        $this->authorize('delete', $partner);

        if ($partner->logo_path) {
            Storage::disk('public')->delete($partner->logo_path);
            $partner->logo_path = null;
            $partner->save();
        }

        $partner->delete();

        return $this->success(null, 'Partner deleted successfully.');
    }

    private function uniqueSlug(string $nameEn): string
    {
        $base = Str::slug($nameEn) ?: 'partner';
        $slug = $base;
        $suffix = 1;

        while (Partner::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}

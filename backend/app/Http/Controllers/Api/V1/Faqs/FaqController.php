<?php

namespace App\Http\Controllers\Api\V1\Faqs;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Faqs\ListFaqsRequest;
use App\Http\Requests\Api\V1\Faqs\StoreFaqRequest;
use App\Http\Requests\Api\V1\Faqs\UpdateFaqRequest;
use App\Http\Resources\Api\V1\Faqs\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FaqController extends BaseController
{
    /** GET /api/v1/faqs */
    public function index(ListFaqsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Faq::class);

        $filters = $request->validated();

        $query = Faq::query();

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("question_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("question_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
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
            'message' => 'FAQs retrieved successfully.',
            'data' => FaqResource::collection($paginator->items()),
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

    /** GET /api/v1/faqs/{faq} */
    public function show(Faq $faq): JsonResponse
    {
        $this->authorize('view', $faq);

        return $this->success(new FaqResource($faq), 'FAQ retrieved successfully.');
    }

    /** POST /api/v1/faqs */
    public function store(StoreFaqRequest $request): JsonResponse
    {
        $this->authorize('create', Faq::class);

        $input = $request->validated();

        $faq = new Faq([
            'question_ar' => $input['question_ar'],
            'question_en' => $input['question_en'],
            'answer_ar' => $input['answer_ar'],
            'answer_en' => $input['answer_en'],
            'category' => $input['category'] ?? null,
            'sort_order' => (int) $input['display_order'],
            'status' => $input['status'],
        ]);
        $faq->published_at = $input['status'] === 'published' ? now() : null;
        $faq->save();

        return $this->success(new FaqResource($faq), 'FAQ created successfully.', 201);
    }

    /** PUT /api/v1/faqs/{faq} */
    public function update(UpdateFaqRequest $request, Faq $faq): JsonResponse
    {
        $this->authorize('update', $faq);

        $input = $request->validated();

        $faq->fill([
            'question_ar' => $input['question_ar'],
            'question_en' => $input['question_en'],
            'answer_ar' => $input['answer_ar'],
            'answer_en' => $input['answer_en'],
            'category' => $input['category'] ?? null,
            'sort_order' => (int) $input['display_order'],
            'status' => $input['status'],
        ]);

        if ($faq->status === 'published' && $faq->published_at === null) {
            $faq->published_at = now();
        }

        $faq->save();

        return $this->success(new FaqResource($faq), 'FAQ updated successfully.');
    }

    /** PATCH /api/v1/faqs/{faq}/status — body {status}. */
    public function setStatus(Request $request, Faq $faq): JsonResponse
    {
        $this->authorize('update', $faq);

        $validated = $request->validate([
            'status' => ['required', 'in:draft,published,archived'],
        ]);

        $faq->status = $validated['status'];
        if ($faq->status === 'published' && $faq->published_at === null) {
            $faq->published_at = now();
        }
        $faq->save();

        return $this->success(new FaqResource($faq), 'FAQ status updated successfully.');
    }

    /**
     * PATCH /api/v1/faqs/reorder — body {ids: [...]}.
     * The list must contain every FAQ exactly once; returns the FAQs in
     * their new order.
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('create', Faq::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $ids = $validated['ids'];
        $existing = Faq::pluck('id')->all();

        if (count($ids) !== count($existing) || array_diff($ids, $existing) !== []) {
            return $this->error('The order must list every FAQ exactly once.', null, 422);
        }

        DB::transaction(function () use ($ids): void {
            foreach ($ids as $position => $id) {
                Faq::whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });

        $faqs = Faq::orderBy('sort_order')->orderBy('id')->get();

        return $this->success(
            FaqResource::collection($faqs),
            'FAQs reordered successfully.',
        );
    }

    /** DELETE /api/v1/faqs/{faq} — soft delete. */
    public function destroy(Faq $faq): JsonResponse
    {
        $this->authorize('delete', $faq);

        $faq->delete();

        return $this->success(null, 'FAQ deleted successfully.');
    }
}

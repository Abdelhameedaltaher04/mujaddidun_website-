<?php

namespace App\Http\Controllers\Api\V1\News;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\News\ListNewsRequest;
use App\Http\Requests\Api\V1\News\StoreNewsRequest;
use App\Http\Requests\Api\V1\News\UpdateNewsRequest;
use App\Http\Resources\Api\V1\News\AdminNewsResource;
use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NewsAdminController extends BaseController
{
    /** GET /api/v1/news — server-side search, filters, pagination. */
    public function index(ListNewsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', News::class);

        $filters = $request->validated();

        $query = News::query()->with(['category', 'author']);

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("title_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("title_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['category'])) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $filters['category']));
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['published_from'])) {
            $query->where('published_at', '>=', Carbon::parse($filters['published_from'])->startOfDay());
        }

        if (! empty($filters['published_to'])) {
            $query->where('published_at', '<=', Carbon::parse($filters['published_to'])->endOfDay());
        }

        $paginator = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'News retrieved successfully.',
            'data' => AdminNewsResource::collection($paginator->items()),
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

    /** GET /api/v1/news/{news} */
    public function show(News $news): JsonResponse
    {
        $this->authorize('view', $news);

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author', 'images'])),
            'News article retrieved successfully.',
        );
    }

    /** POST /api/v1/news (multipart when an image is attached) */
    public function store(StoreNewsRequest $request): JsonResponse
    {
        $this->authorize('create', News::class);

        $input = $request->validated();

        $news = new News($this->mappedAttributes($input));
        $news->author_id = $request->user()->id;
        $news->slug = $this->uniqueSlug($input['title_en']);

        if ($news->status === 'published' && $news->published_at === null) {
            $news->published_at = now();
        }

        if ($request->hasFile('featured_image')) {
            $news->cover_image_path = $request->file('featured_image')->store('news-covers', 'public');
        }

        $news->save();

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author'])),
            'News article created successfully.',
            201,
        );
    }

    /** PUT /api/v1/news/{news} */
    public function update(UpdateNewsRequest $request, News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $input = $request->validated();

        $news->fill($this->mappedAttributes($input));

        if ($news->status === 'published' && $news->published_at === null) {
            $news->published_at = now();
        }

        if ($request->hasFile('featured_image')) {
            $this->deleteCover($news);
            $news->cover_image_path = $request->file('featured_image')->store('news-covers', 'public');
        } elseif ($request->boolean('remove_featured_image')) {
            $this->deleteCover($news);
            $news->cover_image_path = null;
        }

        $news->save();

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author'])),
            'News article updated successfully.',
        );
    }

    /** PATCH /api/v1/news/{news}/publish */
    public function publish(News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $news->status = 'published';
        $news->published_at ??= now();
        $news->save();

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author'])),
            'News article published successfully.',
        );
    }

    /** PATCH /api/v1/news/{news}/unpublish — back to draft, keeps the date. */
    public function unpublish(News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $news->status = 'draft';
        $news->save();

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author'])),
            'News article unpublished successfully.',
        );
    }

    /** PATCH /api/v1/news/{news}/archive */
    public function archive(News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $news->status = 'archived';
        $news->save();

        return $this->success(
            new AdminNewsResource($news->load(['category', 'author'])),
            'News article archived successfully.',
        );
    }

    /** DELETE /api/v1/news/{news} — soft delete; keeps the stored image. */
    public function destroy(News $news): JsonResponse
    {
        $this->authorize('delete', $news);

        // The admin UI treats deletion as permanent; free the stored image.
        $this->deleteCover($news);
        $news->cover_image_path = null;
        $news->save();

        // Free gallery files too (only when no other row references them),
        // then remove the rows so nothing is orphaned by the soft delete.
        foreach ($news->images()->get() as $image) {
            $path = $image->image;
            $image->delete();
            if (! \App\Models\NewsImage::where('image', $path)->exists()) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
            }
        }

        $news->delete();

        return $this->success(null, 'News article deleted successfully.');
    }

    /** @return array<string, mixed> */
    private function mappedAttributes(array $input): array
    {
        $category = NewsCategory::query()
            ->where('slug', $input['category'])
            ->firstOrFail();

        $attributes = [
            'title_ar' => $input['title_ar'],
            'title_en' => $input['title_en'],
            'excerpt_ar' => $input['excerpt_ar'],
            'excerpt_en' => $input['excerpt_en'],
            'content_ar' => $input['content_ar'],
            'content_en' => $input['content_en'],
            'news_category_id' => $category->id,
            'author_name' => $input['author'],
            'status' => $input['status'],
        ];

        // Only touch published_at when the client sent the field: an
        // explicit null clears it, an omitted field preserves the stored
        // value (the frontend always sends it, '' becomes null).
        if (array_key_exists('published_at', $input)) {
            $attributes['published_at'] = $input['published_at'] !== null
                ? Carbon::parse($input['published_at'])
                : null;
        }

        return $attributes;
    }

    private function uniqueSlug(string $titleEn): string
    {
        $base = Str::slug($titleEn) ?: 'news';
        $slug = $base;
        $suffix = 1;

        while (News::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }

    private function deleteCover(News $news): void
    {
        if ($news->cover_image_path) {
            Storage::disk('public')->delete($news->cover_image_path);
        }
    }
}

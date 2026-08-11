<?php

namespace App\Http\Controllers\Api\V1\Gallery;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Gallery\ListAlbumsRequest;
use App\Http\Requests\Api\V1\Gallery\ReorderRequest;
use App\Http\Requests\Api\V1\Gallery\StoreAlbumRequest;
use App\Http\Requests\Api\V1\Gallery\UpdateAlbumRequest;
use App\Http\Resources\Api\V1\Gallery\GalleryAlbumResource;
use App\Models\GalleryAlbum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryAlbumController extends BaseController
{
    /** GET /api/v1/gallery/albums */
    public function index(ListAlbumsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', GalleryAlbum::class);

        $filters = $request->validated();

        $query = GalleryAlbum::query()->withCount('images');

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("title_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("title_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        $paginator = $query
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Albums retrieved successfully.',
            'data' => GalleryAlbumResource::collection($paginator->items()),
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

    /** GET /api/v1/gallery/albums/{album} */
    public function show(GalleryAlbum $album): JsonResponse
    {
        $this->authorize('view', $album);

        return $this->success(
            new GalleryAlbumResource($album->loadCount('images')),
            'Album retrieved successfully.',
        );
    }

    /** POST /api/v1/gallery/albums (multipart when a cover is attached) */
    public function store(StoreAlbumRequest $request): JsonResponse
    {
        $this->authorize('create', GalleryAlbum::class);

        $input = $request->validated();

        $album = new GalleryAlbum([
            'title_ar' => $input['title_ar'],
            'title_en' => $input['title_en'],
            'description_ar' => $input['description_ar'] ?? null,
            'description_en' => $input['description_en'] ?? null,
            'status' => $input['status'],
        ]);
        $album->created_by = $request->user()->id;
        $album->slug = $this->uniqueSlug($input['title_en']);
        $album->published_at = $input['status'] === 'published' ? now() : null;
        $album->sort_order = ((int) GalleryAlbum::withTrashed()->max('sort_order')) + 1;

        if ($request->hasFile('cover_image')) {
            $album->cover_image_path = $request->file('cover_image')->store('gallery-covers', 'public');
        }

        $album->save();

        return $this->success(
            new GalleryAlbumResource($album->loadCount('images')),
            'Album created successfully.',
            201,
        );
    }

    /** PUT /api/v1/gallery/albums/{album} */
    public function update(UpdateAlbumRequest $request, GalleryAlbum $album): JsonResponse
    {
        $this->authorize('update', $album);

        $input = $request->validated();

        $album->fill([
            'title_ar' => $input['title_ar'],
            'title_en' => $input['title_en'],
            'description_ar' => $input['description_ar'] ?? null,
            'description_en' => $input['description_en'] ?? null,
            'status' => $input['status'],
        ]);

        if ($album->status === 'published' && $album->published_at === null) {
            $album->published_at = now();
        }

        $newCoverPath = null;
        if ($request->hasFile('cover_image')) {
            // Store before the transaction so a DB rollback never leaves the
            // album pointing at a missing file; clean up on failure instead.
            $newCoverPath = $request->file('cover_image')->store('gallery-covers', 'public');
        }

        try {
            $orphanedPath = DB::transaction(function () use ($request, $album, $newCoverPath): ?string {
                $locked = GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
                $orphanedPath = null;

                if ($newCoverPath !== null) {
                    // A custom cover replaces any image-backed cover.
                    $orphanedPath = $this->customCoverPath($locked);
                    $locked->images()->update(['is_cover' => false]);
                    $album->cover_image_path = $newCoverPath;
                } elseif ($request->boolean('remove_cover')) {
                    $orphanedPath = $this->customCoverPath($locked);
                    $locked->images()->update(['is_cover' => false]);
                    $album->cover_image_path = null;
                } else {
                    $album->cover_image_path = $locked->cover_image_path;
                }

                $album->save();

                return $orphanedPath;
            });
        } catch (\Throwable $e) {
            if ($newCoverPath !== null) {
                Storage::disk('public')->delete($newCoverPath);
            }
            throw $e;
        }

        // Only delete storage after the database state is committed.
        if ($orphanedPath !== null) {
            Storage::disk('public')->delete($orphanedPath);
        }

        return $this->success(
            new GalleryAlbumResource($album->loadCount('images')),
            'Album updated successfully.',
        );
    }

    /** PATCH /api/v1/gallery/albums/{album}/status — body {status}. */
    public function setStatus(Request $request, GalleryAlbum $album): JsonResponse
    {
        $this->authorize('update', $album);

        $validated = $request->validate([
            'status' => ['required', 'in:draft,published,archived'],
        ]);

        $album->status = $validated['status'];
        if ($album->status === 'published' && $album->published_at === null) {
            $album->published_at = now();
        }
        $album->save();

        return $this->success(
            new GalleryAlbumResource($album->loadCount('images')),
            'Album status updated successfully.',
        );
    }

    /**
     * PATCH /api/v1/gallery/albums/reorder — body {order: [ids]}.
     * The order must be the complete set of existing albums.
     */
    public function reorder(ReorderRequest $request): JsonResponse
    {
        $this->authorize('create', GalleryAlbum::class);

        $order = $request->validated()['order'];
        $existing = GalleryAlbum::pluck('id')->all();

        if (count($order) !== count($existing) || array_diff($order, $existing) !== []) {
            return $this->error('The order must list every album exactly once.', null, 422);
        }

        DB::transaction(function () use ($order): void {
            foreach ($order as $position => $id) {
                GalleryAlbum::whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });

        return $this->success(null, 'Albums reordered successfully.');
    }

    /** DELETE /api/v1/gallery/albums/{album} — soft delete; frees files. */
    public function destroy(GalleryAlbum $album): JsonResponse
    {
        $this->authorize('delete', $album);

        $paths = DB::transaction(function () use ($album): array {
            $locked = GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
            $paths = [];

            if ($path = $this->customCoverPath($locked)) {
                $paths[] = $path;
            }

            foreach ($locked->images()->get() as $image) {
                if ($image->file_path) {
                    $paths[] = $image->file_path;
                }
                $image->delete();
            }

            $locked->cover_image_path = null;
            $locked->save();
            $locked->delete();

            return $paths;
        });

        // Files are freed only after the deletion is committed.
        Storage::disk('public')->delete($paths);

        return $this->success(null, 'Album deleted successfully.');
    }

    /**
     * Returns the album cover path when it is a custom upload — an
     * image-backed cover path points at a gallery image's own file.
     */
    private function customCoverPath(GalleryAlbum $album): ?string
    {
        if ($album->cover_image_path
            && ! $album->images()->where('is_cover', true)->exists()) {
            return $album->cover_image_path;
        }

        return null;
    }

    private function uniqueSlug(string $titleEn): string
    {
        $base = Str::slug($titleEn) ?: 'album';
        $slug = $base;
        $suffix = 1;

        while (GalleryAlbum::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}

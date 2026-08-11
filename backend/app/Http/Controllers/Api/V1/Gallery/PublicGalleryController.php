<?php

namespace App\Http\Controllers\Api\V1\Gallery;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\Gallery\PublicGalleryAlbumResource;
use App\Http\Resources\Api\V1\Gallery\PublicGalleryImageResource;
use App\Models\GalleryAlbum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public read-only gallery. Only published albums (and their images)
 * are ever exposed; draft/archived albums 404 everywhere.
 */
class PublicGalleryController extends BaseController
{
    /** GET /api/v1/public/gallery/albums?page=&per_page= */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer'],
        ]);

        $perPage = min(24, max(1, (int) ($validated['per_page'] ?? 12)));

        $paginator = GalleryAlbum::query()
            ->where('status', 'published')
            ->withCount('images')
            ->orderBy('sort_order')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(perPage: $perPage, page: (int) ($validated['page'] ?? 1));

        return response()->json([
            'success' => true,
            'message' => 'Albums retrieved successfully.',
            'data' => PublicGalleryAlbumResource::collection($paginator->items()),
            'meta' => $this->paginationMeta($paginator),
        ]);
    }

    /** GET /api/v1/public/gallery/albums/{album} */
    public function show(int $album): JsonResponse
    {
        return $this->success(
            new PublicGalleryAlbumResource($this->publishedAlbumOrFail($album)),
            'Album retrieved successfully.',
        );
    }

    /** GET /api/v1/public/gallery/albums/{album}/images?page=&per_page= */
    public function images(Request $request, int $album): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer'],
        ]);

        $model = $this->publishedAlbumOrFail($album);

        $perPage = min(60, max(1, (int) ($validated['per_page'] ?? 24)));

        $paginator = $model->images()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(perPage: $perPage, page: (int) ($validated['page'] ?? 1));

        return response()->json([
            'success' => true,
            'message' => 'Album images retrieved successfully.',
            'data' => PublicGalleryImageResource::collection($paginator->items()),
            'meta' => $this->paginationMeta($paginator),
        ]);
    }

    private function publishedAlbumOrFail(int $album): GalleryAlbum
    {
        $model = GalleryAlbum::query()
            ->where('status', 'published')
            ->withCount('images')
            ->find($album);

        abort_if($model === null, 404);

        return $model;
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api\V1\News;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\News\PublicNewsDetailResource;
use App\Http\Resources\Api\V1\News\PublicNewsListResource;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only public news endpoints (no auth). Only published articles are
 * ever visible; drafts and archived articles behave as if they do not
 * exist (404 on detail, absent from lists).
 */
class PublicNewsController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 9);
        $perPage = max(1, min($perPage, 24));

        $news = News::query()
            ->with('category')
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Public news retrieved successfully.',
            'data' => PublicNewsListResource::collection($news->items()),
            'meta' => [
                'current_page' => $news->currentPage(),
                'last_page' => $news->lastPage(),
                'per_page' => $news->perPage(),
                'total' => $news->total(),
                'from' => $news->firstItem(),
                'to' => $news->lastItem(),
            ],
        ]);
    }

    public function show(News $news): JsonResponse
    {
        if ($news->status !== 'published') {
            return $this->error('News article not found.', null, 404);
        }

        $news->load(['category', 'images']);

        $related = News::query()
            ->with('category')
            ->where('status', 'published')
            ->whereKeyNot($news->getKey())
            ->when($news->news_category_id, function ($query) use ($news) {
                // Prefer same-category articles, then most recent others.
                $query->orderByRaw(
                    'CASE WHEN news_category_id = ? THEN 0 ELSE 1 END',
                    [$news->news_category_id],
                );
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(2)
            ->get();

        return $this->success(
            new PublicNewsDetailResource($news, $related),
            'Public news article retrieved successfully.',
        );
    }
}

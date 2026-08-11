<?php

namespace App\Http\Controllers\Api\V1\News;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Gallery\ReorderRequest;
use App\Http\Requests\Api\V1\News\UploadNewsImagesRequest;
use App\Http\Resources\Api\V1\News\NewsImageResource;
use App\Models\News;
use App\Models\NewsImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Admin management of article gallery images. Files live under
 * news-images/ on the public disk; the routed file endpoint only serves
 * them while the owning article is published (staff excepted).
 */
class NewsImageController extends BaseController
{
    /** GET /news/{news}/images */
    public function index(News $news): JsonResponse
    {
        $this->authorize('view', $news);

        return $this->success(
            NewsImageResource::collection($news->images)->resolve(),
            'News images retrieved successfully.',
        );
    }

    /** POST /news/{news}/images */
    public function store(UploadNewsImagesRequest $request, News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $files = $request->file('images', []);
        $altAr = $request->input('alt_ar', []);
        $altEn = $request->input('alt_en', []);

        $storedPaths = [];

        try {
            foreach ($files as $file) {
                $storedPaths[] = $file->store('news-images', 'public');
            }

            $created = DB::transaction(function () use ($news, $storedPaths, $altAr, $altEn) {
                $next = ((int) $news->images()->max('display_order')) + 1;
                $rows = [];
                foreach ($storedPaths as $i => $path) {
                    $rows[] = $news->images()->create([
                        'image' => $path,
                        'alt_text_ar' => (string) ($altAr[$i] ?? ''),
                        'alt_text_en' => (string) ($altEn[$i] ?? ''),
                        'display_order' => $next + $i,
                    ]);
                }

                return $rows;
            });
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            throw $e;
        }

        return $this->success(
            NewsImageResource::collection(collect($created))->resolve(),
            'News images uploaded successfully.',
            201,
        );
    }

    /** PATCH /news/{news}/images/reorder — body { order: [id, ...] } */
    public function reorder(ReorderRequest $request, News $news): JsonResponse
    {
        $this->authorize('update', $news);

        $order = $request->validated('order');
        $existing = $news->images()->pluck('id')->all();

        if (count($order) !== count($existing) || array_diff($existing, $order) || array_diff($order, $existing)) {
            return $this->error('The order must contain every image of this article exactly once.', null, 422);
        }

        DB::transaction(function () use ($order) {
            foreach ($order as $position => $id) {
                NewsImage::whereKey($id)->update(['display_order' => $position + 1]);
            }
        });

        return $this->success(
            NewsImageResource::collection($news->images()->get())->resolve(),
            'News images reordered successfully.',
        );
    }

    /** DELETE /news/images/{image} */
    public function destroy(NewsImage $image): JsonResponse
    {
        $this->authorize('update', $image->news()->withTrashed()->firstOrFail());

        $path = $image->image;
        $image->delete();

        // Remove the file only if no other row references it.
        if (! NewsImage::where('image', $path)->exists()) {
            Storage::disk('public')->delete($path);
        }

        return $this->success(null, 'News image deleted successfully.');
    }
}

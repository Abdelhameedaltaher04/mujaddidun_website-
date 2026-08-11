<?php

namespace App\Http\Controllers\Api\V1\Gallery;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Gallery\ReorderRequest;
use App\Http\Requests\Api\V1\Gallery\UpdateImageRequest;
use App\Http\Requests\Api\V1\Gallery\UploadImagesRequest;
use App\Http\Resources\Api\V1\Gallery\GalleryImageResource;
use App\Models\GalleryAlbum;
use App\Models\GalleryImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GalleryImageController extends BaseController
{
    /** GET /api/v1/gallery/albums/{album}/images — full ordered list. */
    public function index(GalleryAlbum $album): JsonResponse
    {
        $this->authorize('manageImages', $album);

        $images = $album->images()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(
            GalleryImageResource::collection($images),
            'Images retrieved successfully.',
        );
    }

    /** POST /api/v1/gallery/albums/{album}/images — multipart multi-upload. */
    public function store(UploadImagesRequest $request, GalleryAlbum $album): JsonResponse
    {
        $this->authorize('manageImages', $album);

        $input = $request->validated();
        $files = $input['images'];

        if (count($input['alt_ar']) !== count($files) || count($input['alt_en']) !== count($files)) {
            return $this->error('Each image requires Arabic and English alt text.', 422);
        }

        // Store files before the transaction so a DB rollback never commits
        // rows pointing at missing files; clean up stored files on failure.
        $paths = [];

        try {
            foreach ($files as $file) {
                $paths[] = $file->store('gallery-images', 'public');
            }

            $created = DB::transaction(function () use ($request, $album, $files, $input, $paths) {
                $album = GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
                $nextOrder = ((int) $album->images()->max('sort_order')) + 1;
                $hadCover = $album->cover_image_path !== null;
                $created = [];

                foreach ($files as $i => $file) {
                    $path = $paths[$i];

                    $image = $album->images()->create([
                        'uploaded_by' => $request->user()->id,
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'alt_text_ar' => $input['alt_ar'][$i],
                        'alt_text_en' => $input['alt_en'][$i],
                        'sort_order' => $nextOrder++,
                    ]);

                    // The first image of a coverless album becomes its cover.
                    if (! $hadCover && $i === 0) {
                        $image->is_cover = true;
                        $image->save();
                        $album->cover_image_path = $path;
                        $album->save();
                    }

                    $created[] = $image;
                }

                return $created;
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($paths);
            throw $e;
        }

        return $this->success(
            GalleryImageResource::collection(collect($created)),
            'Images uploaded successfully.',
            201,
        );
    }

    /** PUT /api/v1/gallery/images/{image} — metadata, optional file swap. */
    public function update(UpdateImageRequest $request, GalleryImage $image): JsonResponse
    {
        $album = $image->album;
        if (! $album) {
            abort(404);
        }

        $this->authorize('manageImages', $album);

        $input = $request->validated();

        $newPath = null;
        if ($request->hasFile('image')) {
            // Store before the transaction; clean up if the DB update fails.
            $newPath = $request->file('image')->store('gallery-images', 'public');
        }

        try {
            $oldPath = DB::transaction(function () use ($request, $album, $image, $input, $newPath): ?string {
                GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
                $image->refresh();

                $image->fill([
                    'title_ar' => $input['title_ar'] ?? null,
                    'title_en' => $input['title_en'] ?? null,
                    'alt_text_ar' => $input['alt_ar'],
                    'alt_text_en' => $input['alt_en'],
                    'caption_ar' => $input['caption_ar'] ?? null,
                    'caption_en' => $input['caption_en'] ?? null,
                ]);

                $oldPath = null;
                if ($newPath !== null) {
                    $file = $request->file('image');
                    $oldPath = $image->file_path;
                    $image->file_path = $newPath;
                    $image->file_name = $file->getClientOriginalName();
                    $image->mime_type = $file->getMimeType();
                    $image->file_size = $file->getSize();
                }

                $image->save();

                // Keep an image-backed album cover in sync with the new file.
                if ($newPath !== null && $image->is_cover) {
                    GalleryAlbum::whereKey($album->id)->update(['cover_image_path' => $newPath]);
                }

                return $oldPath;
            });
        } catch (\Throwable $e) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }
            throw $e;
        }

        // Delete the replaced file only after commit and only when nothing
        // references it anymore.
        if ($oldPath !== null && $this->pathUnreferenced($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        return $this->success(
            new GalleryImageResource($image),
            'Image updated successfully.',
        );
    }

    /** PATCH /api/v1/gallery/images/{image}/cover */
    public function setAsCover(GalleryImage $image): JsonResponse
    {
        $album = $image->album;
        if (! $album) {
            abort(404);
        }

        $this->authorize('manageImages', $album);

        $orphanedPath = DB::transaction(function () use ($album, $image): ?string {
            $locked = GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
            $image->refresh();

            // A previous custom cover file is no longer referenced by anyone.
            $orphanedPath = null;
            if ($locked->cover_image_path
                && ! $locked->images()->where('is_cover', true)->exists()) {
                $orphanedPath = $locked->cover_image_path;
            }

            $locked->images()->whereKeyNot($image->id)->update(['is_cover' => false]);
            $image->is_cover = true;
            $image->save();
            $locked->cover_image_path = $image->file_path;
            $locked->save();

            return $orphanedPath;
        });

        if ($orphanedPath !== null && $this->pathUnreferenced($orphanedPath)) {
            Storage::disk('public')->delete($orphanedPath);
        }

        return $this->success(
            new GalleryImageResource($image->refresh()),
            'Cover image updated successfully.',
        );
    }

    /**
     * PATCH /api/v1/gallery/albums/{album}/images/reorder — {order:[ids]}.
     * The order must be the complete set of the album's images.
     */
    public function reorder(ReorderRequest $request, GalleryAlbum $album): JsonResponse
    {
        $this->authorize('manageImages', $album);

        $order = $request->validated()['order'];
        $existing = $album->images()->pluck('id')->all();

        if (count($order) !== count($existing) || array_diff($order, $existing) !== []) {
            return $this->error("The order must list every image in this album exactly once.", 422);
        }

        DB::transaction(function () use ($album, $order): void {
            foreach ($order as $position => $id) {
                $album->images()->whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });

        return $this->success(null, 'Images reordered successfully.');
    }

    /** True when no live image row or album cover still uses the path. */
    private function pathUnreferenced(string $path): bool
    {
        return ! GalleryImage::where('file_path', $path)->exists()
            && ! GalleryAlbum::where('cover_image_path', $path)->exists();
    }

    /** DELETE /api/v1/gallery/images/{image} */
    public function destroy(GalleryImage $image): JsonResponse
    {
        $album = $image->album;
        if (! $album) {
            abort(404);
        }

        $this->authorize('manageImages', $album);

        $removedPath = DB::transaction(function () use ($album, $image): ?string {
            $locked = GalleryAlbum::whereKey($album->id)->lockForUpdate()->firstOrFail();
            $image->refresh();

            $wasCover = $image->is_cover;
            $removedPath = $image->file_path;
            $image->delete();

            if ($wasCover) {
                // Promote the first remaining image, or leave the album coverless.
                $next = $locked->images()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first();

                if ($next) {
                    $next->update(['is_cover' => true]);
                    $locked->cover_image_path = $next->file_path;
                } else {
                    $locked->cover_image_path = null;
                }
                $locked->save();
            }

            return $removedPath;
        });

        // Delete storage only after the commit, and only if the path is not
        // still referenced (e.g. adopted as a cover elsewhere meanwhile).
        if ($removedPath !== null && $this->pathUnreferenced($removedPath)) {
            Storage::disk('public')->delete($removedPath);
        }

        return $this->success(null, 'Image deleted successfully.');
    }
}

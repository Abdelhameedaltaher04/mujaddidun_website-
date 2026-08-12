<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Content\StoreCtaSectionRequest;
use App\Models\SiteCtaSection;
use App\Models\WebsiteSetting;
use App\Services\Content\WebsiteContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteCtaSectionController extends BaseController
{
    public function __construct(private readonly WebsiteContentService $content)
    {
    }

    /** POST /content/ctas (admin only; multipart). */
    public function store(StoreCtaSectionRequest $request): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $input = $request->validated();
        unset($input['image'], $input['remove_image']);
        $input['display_order'] = ((int) SiteCtaSection::max('display_order')) + 1;

        if ($request->hasFile('image')) {
            $input['image_path'] = $this->content->storeCtaImage($request->file('image'));
        }

        $cta = SiteCtaSection::create($input);

        return $this->success($this->content->presentCta($cta), 'CTA section created successfully.', 201);
    }

    /** PUT /content/ctas/{cta} (admin only; multipart via _method spoof). */
    public function update(StoreCtaSectionRequest $request, SiteCtaSection $cta): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $input = $request->validated();
        $removeImage = (bool) ($input['remove_image'] ?? false);
        unset($input['image'], $input['remove_image']);

        if ($request->hasFile('image')) {
            $this->content->deleteFile($cta->image_path);
            $input['image_path'] = $this->content->storeCtaImage($request->file('image'));
        } elseif ($removeImage) {
            $this->content->deleteFile($cta->image_path);
            $input['image_path'] = null;
        }

        $cta->update($input);

        return $this->success($this->content->presentCta($cta->fresh()), 'CTA section updated successfully.');
    }

    /** DELETE /content/ctas/{cta} (admin only). */
    public function destroy(SiteCtaSection $cta): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $this->content->deleteFile($cta->image_path);
        $cta->delete();

        return $this->success(null, 'CTA section deleted successfully.');
    }

    /** PATCH /content/ctas/reorder — body {ids: [...]} (admin only). */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $ids = $validated['ids'];
        $existing = SiteCtaSection::pluck('id')->all();

        if (count($ids) !== count($existing) || array_diff($ids, $existing) !== []) {
            return $this->error('The order must list every CTA section exactly once.', null, 422);
        }

        DB::transaction(function () use ($ids): void {
            foreach ($ids as $position => $id) {
                SiteCtaSection::whereKey($id)->update(['display_order' => $position + 1]);
            }
        });

        $ctas = SiteCtaSection::orderBy('display_order')->orderBy('id')->get()
            ->map(fn (SiteCtaSection $row) => $this->content->presentCta($row));

        return $this->success($ctas, 'CTA sections reordered successfully.');
    }
}

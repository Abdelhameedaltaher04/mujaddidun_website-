<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Content\UpdateContentSectionRequest;
use App\Models\WebsiteSetting;
use App\Services\Content\WebsiteContentService;
use Illuminate\Http\JsonResponse;

class WebsiteContentController extends BaseController
{
    public function __construct(private readonly WebsiteContentService $content)
    {
    }

    /** GET /content — full admin payload (admin only). */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', WebsiteSetting::class);

        return $this->success($this->content->all());
    }

    /** GET /public/content — sanitized, no auth. */
    public function publicIndex(): JsonResponse
    {
        return $this->success($this->content->publicContent());
    }

    /** PUT /content/{section} (admin only; multipart via _method spoof). */
    public function update(UpdateContentSectionRequest $request, string $section): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $validated = $request->validated();

        $files = [];
        $removals = [];
        foreach (array_keys($validated) as $key) {
            if ($request->hasFile($key)) {
                $files[$key] = $request->file($key);
                unset($validated[$key]);
            } elseif (str_starts_with($key, 'remove_')) {
                $removals[$key] = (bool) $validated[$key];
                unset($validated[$key]);
            }
        }

        // File inputs validated but absent must not overwrite stored paths.
        foreach (['background_image', 'image'] as $fileKey) {
            unset($validated[$fileKey]);
        }

        $this->content->save($section, $validated, $files, $removals, $request->user()->id);

        return $this->success($this->content->all(), 'Content updated successfully.');
    }
}

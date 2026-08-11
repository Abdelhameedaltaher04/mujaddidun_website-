<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Settings\UpdateSettingsSectionRequest;
use App\Models\WebsiteSetting;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends BaseController
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    /** GET /settings — full admin payload (admin only). */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', WebsiteSetting::class);

        return $this->success($this->settings->all());
    }

    /** GET /settings/public — sanitized, no auth, safe fields only. */
    public function publicIndex(): JsonResponse
    {
        return $this->success($this->settings->publicSettings());
    }

    /** PUT /settings/{section} (admin only). */
    public function update(UpdateSettingsSectionRequest $request, string $section): JsonResponse
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

        // File inputs validated but absent (no upload) must not overwrite
        // stored paths — drop any file-rule keys that slipped through.
        foreach (['logo', 'favicon', 'primary_logo', 'footer_logo', 'og_image'] as $fileKey) {
            unset($validated[$fileKey]);
        }

        $this->settings->save($section, $validated, $files, $removals, $request->user()->id);

        return $this->success(
            $this->settings->all(),
            'Settings updated successfully.',
        );
    }
}

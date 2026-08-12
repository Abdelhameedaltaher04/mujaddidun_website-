<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\HomepageSection;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomepageSectionController extends BaseController
{
    /**
     * PUT /content/homepage-sections (admin only).
     * Body: {sections: [{section_key, is_visible}, ...]} in the desired
     * display order. Every existing section must appear exactly once —
     * sections are fixed; only visibility and order are editable.
     */
    public function update(Request $request): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $validated = $request->validate([
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.section_key' => ['required', 'string', 'distinct'],
            'sections.*.is_visible' => ['required', 'boolean'],
        ]);

        $keys = array_column($validated['sections'], 'section_key');
        $existing = HomepageSection::pluck('section_key')->all();

        if (count($keys) !== count($existing) || array_diff($keys, $existing) !== []) {
            return $this->error('The list must contain every homepage section exactly once.', null, 422);
        }

        DB::transaction(function () use ($validated): void {
            foreach ($validated['sections'] as $position => $row) {
                HomepageSection::where('section_key', $row['section_key'])->update([
                    'is_visible' => $row['is_visible'],
                    'display_order' => $position + 1,
                ]);
            }
        });

        return $this->success(
            HomepageSection::orderBy('display_order')->orderBy('id')
                ->get(['id', 'section_key', 'is_visible', 'display_order']),
            'Homepage sections updated successfully.',
        );
    }
}

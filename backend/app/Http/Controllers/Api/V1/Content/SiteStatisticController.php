<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Content\StoreSiteStatisticRequest;
use App\Models\SiteStatistic;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteStatisticController extends BaseController
{
    /** POST /content/statistics (admin only). */
    public function store(StoreSiteStatisticRequest $request): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $input = $request->validated();
        $input['display_order'] = ((int) SiteStatistic::max('display_order')) + 1;

        $statistic = SiteStatistic::create($input);

        return $this->success($statistic, 'Statistic created successfully.', 201);
    }

    /** PUT /content/statistics/{statistic} (admin only). */
    public function update(StoreSiteStatisticRequest $request, SiteStatistic $statistic): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $statistic->update($request->validated());

        return $this->success($statistic->fresh(), 'Statistic updated successfully.');
    }

    /** DELETE /content/statistics/{statistic} (admin only). */
    public function destroy(SiteStatistic $statistic): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $statistic->delete();

        return $this->success(null, 'Statistic deleted successfully.');
    }

    /** PATCH /content/statistics/reorder — body {ids: [...]} (admin only). */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('manage', WebsiteSetting::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $ids = $validated['ids'];
        $existing = SiteStatistic::pluck('id')->all();

        if (count($ids) !== count($existing) || array_diff($ids, $existing) !== []) {
            return $this->error('The order must list every statistic exactly once.', null, 422);
        }

        DB::transaction(function () use ($ids): void {
            foreach ($ids as $position => $id) {
                SiteStatistic::whereKey($id)->update(['display_order' => $position + 1]);
            }
        });

        return $this->success(
            SiteStatistic::orderBy('display_order')->orderBy('id')->get(),
            'Statistics reordered successfully.',
        );
    }
}

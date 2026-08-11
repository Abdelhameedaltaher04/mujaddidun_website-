<?php

namespace App\Http\Controllers\Api\V1\Programs;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Programs\ListProgramsRequest;
use App\Http\Requests\Api\V1\Programs\StoreProgramRequest;
use App\Http\Requests\Api\V1\Programs\UpdateProgramRequest;
use App\Http\Resources\Api\V1\Programs\AdminProgramResource;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProgramAdminController extends BaseController
{
    /** Count of seats taken (non-rejected participants). */
    private function activeCount(): array
    {
        return [
            'participants as active_participants_count' => fn ($q) => $q->where('status', '!=', 'rejected'),
        ];
    }

    /** GET /api/v1/programs */
    public function index(ListProgramsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Program::class);

        $filters = $request->validated();

        $query = Program::query()->withCount($this->activeCount());

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("title_ar like ? escape '\\'", [$like])
                    ->orWhereRaw("title_en like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('starts_on', '>=', Carbon::parse($filters['date_from'])->toDateString());
        }

        if (! empty($filters['date_to'])) {
            $query->where('starts_on', '<=', Carbon::parse($filters['date_to'])->toDateString());
        }

        $paginator = $query
            ->orderByDesc('starts_on')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Programs retrieved successfully.',
            'data' => AdminProgramResource::collection($paginator->items()),
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

    /** GET /api/v1/programs/{program} */
    public function show(Program $program): JsonResponse
    {
        $this->authorize('view', $program);

        return $this->success(
            new AdminProgramResource($program->loadCount($this->activeCount())),
            'Program retrieved successfully.',
        );
    }

    /** POST /api/v1/programs (multipart when an image is attached) */
    public function store(StoreProgramRequest $request): JsonResponse
    {
        $this->authorize('create', Program::class);

        $input = $request->validated();

        $program = new Program($this->mappedAttributes($input));
        $program->created_by = $request->user()->id;
        $program->slug = $this->uniqueSlug($input['title_en']);

        if ($request->hasFile('image')) {
            $program->cover_image_path = $request->file('image')->store('program-covers', 'public');
        }

        $program->save();

        return $this->success(
            new AdminProgramResource($program->loadCount($this->activeCount())),
            'Program created successfully.',
            201,
        );
    }

    /** PUT /api/v1/programs/{program} */
    public function update(UpdateProgramRequest $request, Program $program): JsonResponse
    {
        $this->authorize('update', $program);

        $program->fill($this->mappedAttributes($request->validated()));

        if ($request->hasFile('image')) {
            $this->deleteCover($program);
            $program->cover_image_path = $request->file('image')->store('program-covers', 'public');
        } elseif ($request->boolean('remove_image')) {
            $this->deleteCover($program);
            $program->cover_image_path = null;
        }

        $program->save();

        return $this->success(
            new AdminProgramResource($program->loadCount($this->activeCount())),
            'Program updated successfully.',
        );
    }

    /** PATCH /api/v1/programs/{program}/activate */
    public function activate(Program $program): JsonResponse
    {
        return $this->setStatus($program, 'active', 'Program activated successfully.');
    }

    /** PATCH /api/v1/programs/{program}/deactivate — back to draft. */
    public function deactivate(Program $program): JsonResponse
    {
        return $this->setStatus($program, 'draft', 'Program deactivated successfully.');
    }

    /** PATCH /api/v1/programs/{program}/archive */
    public function archive(Program $program): JsonResponse
    {
        return $this->setStatus($program, 'archived', 'Program archived successfully.');
    }

    /** DELETE /api/v1/programs/{program} — soft delete; frees the stored image. */
    public function destroy(Program $program): JsonResponse
    {
        $this->authorize('delete', $program);

        $this->deleteCover($program);
        $program->cover_image_path = null;
        $program->save();
        $program->delete();

        return $this->success(null, 'Program deleted successfully.');
    }

    private function setStatus(Program $program, string $status, string $message): JsonResponse
    {
        $this->authorize('update', $program);

        $program->status = $status;
        $program->save();

        return $this->success(
            new AdminProgramResource($program->loadCount($this->activeCount())),
            $message,
        );
    }

    /** @return array<string, mixed> */
    private function mappedAttributes(array $input): array
    {
        return [
            'title_ar' => $input['title_ar'],
            'title_en' => $input['title_en'],
            'summary_ar' => $input['excerpt_ar'],
            'summary_en' => $input['excerpt_en'],
            'description_ar' => $input['description_ar'],
            'description_en' => $input['description_en'],
            'category' => $input['category'],
            'target_audience_ar' => $input['target_audience_ar'],
            'target_audience_en' => $input['target_audience_en'],
            'location_ar' => $input['location_ar'],
            'location_en' => $input['location_en'],
            'starts_on' => Carbon::parse($input['start_date'])->toDateString(),
            'ends_on' => Carbon::parse($input['end_date'])->toDateString(),
            'capacity' => (int) $input['max_participants'],
            'objectives_ar' => $input['objectives_ar'],
            'objectives_en' => $input['objectives_en'],
            'requirements_ar' => $input['requirements_ar'],
            'requirements_en' => $input['requirements_en'],
            'status' => $input['status'],
        ];
    }

    private function uniqueSlug(string $titleEn): string
    {
        $base = Str::slug($titleEn) ?: 'program';
        $slug = $base;
        $suffix = 1;

        while (Program::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }

    private function deleteCover(Program $program): void
    {
        if ($program->cover_image_path) {
            Storage::disk('public')->delete($program->cover_image_path);
        }
    }
}

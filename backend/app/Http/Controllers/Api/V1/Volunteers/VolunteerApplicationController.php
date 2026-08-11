<?php

namespace App\Http\Controllers\Api\V1\Volunteers;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Volunteers\ListVolunteerApplicationsRequest;
use App\Http\Requests\Api\V1\Volunteers\StoreApplicationNoteRequest;
use App\Http\Requests\Api\V1\Volunteers\UpdateApplicationStatusRequest;
use App\Http\Resources\Api\V1\Volunteers\ApplicationDocumentResource;
use App\Http\Resources\Api\V1\Volunteers\ApplicationNoteResource;
use App\Http\Resources\Api\V1\Volunteers\VolunteerApplicationResource;
use App\Models\VolunteerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VolunteerApplicationController extends BaseController
{
    /**
     * Allowed status transitions in UI vocabulary (`pending` = DB
     * `submitted`). Approved/rejected/withdrawn are final.
     */
    private const TRANSITIONS = [
        'pending' => ['under_review', 'approved', 'rejected', 'withdrawn'],
        'under_review' => ['approved', 'rejected', 'withdrawn'],
        'approved' => [],
        'rejected' => [],
        'withdrawn' => [],
    ];

    public function index(ListVolunteerApplicationsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', VolunteerApplication::class);

        $filters = $request->validated();

        $query = VolunteerApplication::query()
            ->with(['volunteer.user', 'program'])
            ->latest('submitted_at')
            ->latest('id');

        if (! empty($filters['search'])) {
            $escaped = addcslashes($filters['search'], '\\%_');
            $like = "%{$escaped}%";
            $query->whereHas('volunteer', function ($volunteer) use ($like): void {
                $volunteer->where(function ($inner) use ($like): void {
                    $inner->where(DB::raw("first_name || ' ' || last_name"), 'like', $like, )
                        ->orWhere('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $this->dbStatus($filters['status']));
        }

        if (! empty($filters['program_id'])) {
            $query->where('program_id', $filters['program_id']);
        }

        if ($from = $this->parseDate($filters['date_from'] ?? null)) {
            $query->whereDate('submitted_at', '>=', $from);
        }

        if ($to = $this->parseDate($filters['date_to'] ?? null)) {
            $query->whereDate('submitted_at', '<=', $to);
        }

        $paginator = $query->paginate(
            perPage: (int) ($filters['per_page'] ?? 10),
            page: (int) ($filters['page'] ?? 1),
        );

        return response()->json([
            'success' => true,
            'message' => 'Request completed successfully.',
            'data' => VolunteerApplicationResource::collection($paginator->items())->resolve(),
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

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', VolunteerApplication::class);

        $counts = VolunteerApplication::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return $this->success([
            'total' => (int) $counts->sum(),
            'pending' => (int) ($counts['submitted'] ?? 0),
            'under_review' => (int) ($counts['under_review'] ?? 0),
            'approved' => (int) ($counts['approved'] ?? 0),
            'rejected' => (int) ($counts['rejected'] ?? 0),
        ]);
    }

    public function show(VolunteerApplication $application): JsonResponse
    {
        $this->authorize('view', $application);

        $application->load(['volunteer.user', 'program']);

        return $this->success(new VolunteerApplicationResource($application));
    }

    public function setStatus(
        UpdateApplicationStatusRequest $request,
        VolunteerApplication $application,
    ): JsonResponse {
        $this->authorize('manage', $application);

        $target = $request->validated('status');

        $result = DB::transaction(function () use ($application, $target, $request) {
            $locked = VolunteerApplication::query()
                ->lockForUpdate()
                ->findOrFail($application->id);

            $current = $locked->status === 'submitted' ? 'pending' : $locked->status;

            if (! in_array($target, self::TRANSITIONS[$current] ?? [], true)) {
                return $current;
            }

            $locked->fill([
                'status' => $target,
                'rejection_reason' => $target === 'rejected'
                    ? trim((string) $request->validated('rejection_reason'))
                    : null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ])->save();

            return $locked;
        });

        if (is_string($result)) {
            return $this->error(
                "This application cannot move from '{$result}' to '{$target}'.",
                null,
                422,
            );
        }

        $result->load(['volunteer.user', 'program']);

        return $this->success(
            new VolunteerApplicationResource($result),
            'Application status updated successfully.',
        );
    }

    public function notes(VolunteerApplication $application): JsonResponse
    {
        $this->authorize('manage', $application);

        $notes = $application->notes()
            ->with('author')
            ->latest('created_at')
            ->latest('id')
            ->get();

        return $this->success(ApplicationNoteResource::collection($notes));
    }

    public function storeNote(
        StoreApplicationNoteRequest $request,
        VolunteerApplication $application,
    ): JsonResponse {
        $this->authorize('manage', $application);

        $note = $application->notes()->create([
            'author_id' => $request->user()->id,
            'body' => trim($request->validated('body')),
        ]);

        $note->load('author');

        return $this->success(
            new ApplicationNoteResource($note),
            'Note added successfully.',
            201,
        );
    }

    public function documents(VolunteerApplication $application): JsonResponse
    {
        $this->authorize('manage', $application);

        $documents = $application->documents()
            ->orderBy('uploaded_at')
            ->get();

        return $this->success(ApplicationDocumentResource::collection($documents));
    }

    /** Maps the frontend status vocabulary to the database enum. */
    private function dbStatus(string $status): string
    {
        return $status === 'pending' ? 'submitted' : $status;
    }

    /**
     * Returns the value when it is a complete, valid Y-m-d date, else
     * null (mid-typing values from native date inputs are ignored).
     */
    private function parseDate(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return ($parsed && $parsed->format('Y-m-d') === $value) ? $value : null;
    }
}

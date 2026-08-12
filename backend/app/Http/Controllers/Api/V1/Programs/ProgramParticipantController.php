<?php

namespace App\Http\Controllers\Api\V1\Programs;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Programs\ListParticipantsRequest;
use App\Http\Resources\Api\V1\Programs\ProgramParticipantResource;
use App\Models\Program;
use App\Models\ProgramParticipant;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgramParticipantController extends BaseController
{
    /** GET /api/v1/programs/{program}/participants */
    public function index(ListParticipantsRequest $request, Program $program): JsonResponse
    {
        $this->authorize('manageParticipants', $program);

        $filters = $request->validated();

        $query = $program->participants();

        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like): void {
                $q->whereRaw("full_name like ? escape '\\'", [$like])
                    ->orWhereRaw("email like ? escape '\\'", [$like])
                    ->orWhereRaw("phone like ? escape '\\'", [$like]);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $paginator = $query
            ->orderByDesc('registered_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: (int) ($filters['per_page'] ?? 10),
                page: (int) ($filters['page'] ?? 1),
            );

        return response()->json([
            'success' => true,
            'message' => 'Participants retrieved successfully.',
            'data' => ProgramParticipantResource::collection($paginator->items()),
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

    /** PATCH /api/v1/participants/{participant}/approve */
    public function approve(ProgramParticipant $participant): JsonResponse
    {
        return $this->setStatus($participant, 'approved', 'Participant approved successfully.');
    }

    /** PATCH /api/v1/participants/{participant}/reject */
    public function reject(ProgramParticipant $participant): JsonResponse
    {
        return $this->setStatus($participant, 'rejected', 'Participant rejected successfully.');
    }

    private function setStatus(ProgramParticipant $participant, string $status, string $message): JsonResponse
    {
        // The program relation excludes soft-deleted parents; treat orphaned
        // participants as not found rather than failing authorization.
        $program = $participant->program;
        abort_if($program === null, 404);

        $this->authorize('manageParticipants', $program);

        $participant->status = $status;
        $participant->save();

        return $this->success(new ProgramParticipantResource($participant), $message);
    }

    /**
     * POST /api/v1/programs/{program}/participate — self-enrollment for the
     * authenticated user (server-side guards required by the spec; the
     * public site will consume this endpoint later).
     */
    public function participate(Request $request, Program $program): JsonResponse
    {
        $user = $request->user();

        // Staff accounts manage programs; they must not self-enroll as
        // participants. Enforced server-side (not just hidden UI).
        if (in_array($user->role?->slug, ['admin', 'moderator'], true)) {
            return $this->error('Staff accounts cannot join programs.', ['code' => 'staff_not_allowed'], 403);
        }

        // Serialize concurrent enrollments for the same program so two
        // requests cannot both take the last seat or double-enroll.
        try {
            return DB::transaction(function () use ($program, $user) {
                $program = Program::query()->lockForUpdate()->findOrFail($program->id);

                return $this->attemptParticipation($program, $user);
            });
        } catch (UniqueConstraintViolationException) {
            return $this->error('You are already registered for this program.', ['code' => 'already_registered'], 422);
        }
    }

    private function attemptParticipation(Program $program, User $user): JsonResponse
    {
        if ($program->status === 'archived') {
            return $this->error('This program has been archived.', ['code' => 'closed'], 422);
        }

        if ($program->status !== 'active') {
            return $this->error('This program is not accepting participants.', ['code' => 'closed'], 422);
        }

        $activeCount = $program->participants()->where('status', '!=', 'rejected')->count();
        if ($program->capacity !== null && $activeCount >= $program->capacity) {
            return $this->error('This program has reached its maximum participants.', ['code' => 'full'], 422);
        }

        $alreadyRegistered = $program->participants()
            ->where('status', '!=', 'rejected')
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)->orWhere('email', $user->email);
            })
            ->exists();

        if ($alreadyRegistered) {
            return $this->error('You are already registered for this program.', ['code' => 'already_registered'], 422);
        }

        // A unique (program_id, email) constraint means a previously
        // rejected participation must be reactivated, not re-created.
        $rejected = $program->participants()
            ->where('status', 'rejected')
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)->orWhere('email', $user->email);
            })
            ->first();

        if ($rejected) {
            $rejected->fill([
                'user_id' => $user->id,
                'status' => 'pending',
                'registered_at' => now(),
            ])->save();
            $participant = $rejected;
        } else {
            $participant = $program->participants()->create([
                'user_id' => $user->id,
                'full_name' => trim($user->first_name.' '.$user->last_name),
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => 'pending',
                'registered_at' => now(),
            ]);
        }

        return $this->success(
            new ProgramParticipantResource($participant),
            'Registered for the program successfully.',
            201,
        );
    }
}

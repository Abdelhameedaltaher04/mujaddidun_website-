<?php

namespace App\Http\Controllers\Api\V1\Volunteers;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Volunteers\StorePublicVolunteerApplicationRequest;
use App\Models\Volunteer;
use App\Models\VolunteerApplication;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Public volunteer application endpoint (no auth). Creates (or reuses by
 * email) a Volunteer profile and files a `submitted` application. Interest
 * and availability option ids are translated to the canonical Arabic labels
 * used across the admin UI. Status/review fields are server-controlled.
 */
class PublicVolunteerApplicationController extends BaseController
{
    /** Public form option ids -> canonical Arabic labels stored in the DB. */
    private const INTEREST_LABELS = [
        'feeding' => 'الإطعام',
        'housing' => 'الإسكان',
        'empowerment' => 'التمكين',
        'admin' => 'الدعم الإداري',
        'media' => 'الإعلام والتصوير',
        'events' => 'تنظيم الفعاليات',
    ];

    private const AVAILABILITY_LABELS = [
        'morning' => 'صباحاً',
        'evening' => 'مساءً',
        'weekends' => 'عطلة نهاية الأسبوع',
    ];

    public function store(StorePublicVolunteerApplicationRequest $request): JsonResponse
    {
        $fullName = preg_replace('/\s+/u', ' ', trim($request->validated('full_name')));
        $parts = explode(' ', $fullName, 2);
        $firstName = mb_substr($parts[0], 0, 100);
        $lastName = mb_substr($parts[1] ?? '', 0, 100);

        $email = mb_strtolower(trim($request->validated('email')));

        $skills = implode(', ', array_map(
            fn (string $id): string => self::INTEREST_LABELS[$id],
            array_values(array_unique($request->validated('interests'))),
        ));
        $availability = implode(', ', array_map(
            fn (string $id): string => self::AVAILABILITY_LABELS[$id],
            array_values(array_unique($request->validated('availability'))),
        ));

        $store = function () use ($request, $email, $firstName, $lastName, $skills, $availability): VolunteerApplication {
            return DB::transaction(function () use ($request, $email, $firstName, $lastName, $skills, $availability) {
                // Lock the profile row so concurrent submissions for the same
                // email serialize on the open-application check.
                $volunteer = Volunteer::query()
                    ->where('email', $email)
                    ->lockForUpdate()
                    ->first();

                if ($volunteer) {
                    // One open application per applicant. Return the existing
                    // open application instead of an error so the response is
                    // indistinguishable from a fresh submission (no
                    // email/status enumeration through this public endpoint).
                    $open = $volunteer->applications()
                        ->whereIn('status', ['submitted', 'under_review'])
                        ->orderByDesc('id')
                        ->first();
                    if ($open) {
                        return $open;
                    }
                    // Deliberately do NOT overwrite the stored profile: this
                    // endpoint is unauthenticated, so an email match must not
                    // let a stranger rewrite an existing volunteer's PII. The
                    // submitted details are preserved verbatim on the
                    // application's applicant_snapshot for reviewers.
                } else {
                    $volunteer = Volunteer::create([
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $email,
                        'phone' => trim($request->validated('phone')),
                        'date_of_birth' => $request->validated('date_of_birth'),
                        'skills' => $skills,
                        'availability' => $availability,
                        'status' => 'pending',
                    ]);
                }

                return VolunteerApplication::create([
                    'volunteer_id' => $volunteer->id,
                    'status' => 'submitted',
                    'experience' => trim((string) $request->validated('experience')) ?: null,
                    // Immutable record of what THIS submission said, since the
                    // profile itself is never updated from the public form.
                    'applicant_snapshot' => [
                        'full_name' => trim($firstName.' '.$lastName),
                        'date_of_birth' => $request->validated('date_of_birth'),
                        'phone' => trim($request->validated('phone')),
                        'skills' => $skills,
                        'availability' => $availability,
                    ],
                    'submitted_at' => now(),
                ]);
            });
        };

        try {
            $application = $store();
        } catch (UniqueConstraintViolationException) {
            // A concurrent request created the profile between our lookup and
            // insert; retry once — the profile now exists and will be reused.
            $application = $store();
        }

        // Minimal public echo: reference + status only. No profile or
        // review data.
        return $this->success([
            'id' => $application->id,
            'status' => 'pending',
        ], 'تم إرسال طلب التطوع بنجاح.', 201);
    }
}

<?php

namespace App\Http\Resources\Api\V1\Volunteers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Maps a VolunteerApplication (plus its Volunteer profile) to the admin
 * UI contract. DB status `submitted` is exposed as `pending`.
 */
class VolunteerApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $volunteer = $this->volunteer;
        $user = $volunteer?->user;

        $skills = collect(explode(',', (string) $volunteer?->skills))
            ->map(fn (string $skill) => trim($skill))
            ->filter()
            ->values()
            ->all();

        return [
            'id' => $this->id,
            'full_name' => trim(($volunteer?->first_name ?? '').' '.($volunteer?->last_name ?? '')),
            'email' => $volunteer?->email ?? '',
            'phone' => $volunteer?->phone,
            'avatar_url' => $user?->avatar_path
                ? Storage::disk('public')->url($user->avatar_path)
                : null,
            'country' => $volunteer?->country_code,
            'date_of_birth' => $volunteer?->date_of_birth?->format('Y-m-d'),
            'skills' => $skills,
            'experience' => $this->experience,
            'education' => $this->education,
            'preferred_area' => $this->preferred_area,
            'program' => $this->program ? [
                'id' => $this->program->id,
                'title_ar' => $this->program->title_ar,
                'title_en' => $this->program->title_en,
            ] : null,
            'availability' => $volunteer?->availability,
            'motivation' => $this->motivation,
            'status' => $this->status === 'submitted' ? 'pending' : $this->status,
            'rejection_reason' => $this->rejection_reason,
            'applied_at' => $this->submitted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

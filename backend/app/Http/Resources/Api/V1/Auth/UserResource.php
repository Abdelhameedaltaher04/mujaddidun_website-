<?php

namespace App\Http\Resources\Api\V1\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role->id,
                'name' => $this->role->name,
                'slug' => $this->role->slug,
            ]),
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country_code' => $this->country_code,
            'avatar_path' => $this->avatar_path,
            // An uploaded avatar always wins; the Google picture is only a
            // fallback for accounts that have never uploaded one. Google
            // returns an absolute URL, which the frontend passes through
            // unchanged, while local paths keep the /api/v1/files prefix.
            'avatar_url' => $this->avatar_path
                ? '/api/v1/files/'.$this->avatar_path
                : ($this->google_avatar_url ?: null),
            'bio' => $this->bio,
            'locale' => $this->locale,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'phone_verified_at' => $this->phone_verified_at,
            'created_at' => $this->created_at,
        ];
    }
}
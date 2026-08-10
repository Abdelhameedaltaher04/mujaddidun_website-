<?php

namespace App\Http\Resources\Api\V1\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventRegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'participant_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone ?? '',
            'status' => $this->status,
            'registered_at' => $this->registered_at?->toISOString(),
        ];
    }
}

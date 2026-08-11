<?php

namespace App\Http\Resources\Api\V1\Volunteers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $author = $this->author;

        return [
            'id' => $this->id,
            'body' => $this->body,
            'author_name' => $author
                ? trim($author->first_name.' '.$author->last_name)
                : 'مستخدم محذوف',
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}

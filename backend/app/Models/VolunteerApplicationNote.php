<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerApplicationNote extends Model
{
    protected $fillable = [
        'volunteer_application_id',
        'author_id',
        'body',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(VolunteerApplication::class, 'volunteer_application_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

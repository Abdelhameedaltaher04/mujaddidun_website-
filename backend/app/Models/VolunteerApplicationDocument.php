<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerApplicationDocument extends Model
{
    protected $fillable = [
        'volunteer_application_id',
        'name',
        'file_path',
        'mime_type',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(VolunteerApplication::class, 'volunteer_application_id');
    }
}

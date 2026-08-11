<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VolunteerApplication extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'volunteer_id',
        'program_id',
        'reviewed_by',
        'status',
        'motivation',
        'preferred_area',
        'experience',
        'education',
        'review_notes',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(Volunteer::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(VolunteerApplicationNote::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VolunteerApplicationDocument::class);
    }
}
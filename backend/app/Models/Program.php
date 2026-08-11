<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'title_ar',
        'title_en',
        'slug',
        'summary_ar',
        'summary_en',
        'description_ar',
        'description_en',
        'cover_image_path',
        'status',
        'starts_on',
        'ends_on',
        'is_featured',
        'category',
        'target_audience_ar',
        'target_audience_en',
        'location_ar',
        'location_en',
        'capacity',
        'objectives_ar',
        'objectives_en',
        'requirements_ar',
        'requirements_en',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'is_featured' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function volunteerApplications(): HasMany
    {
        return $this->hasMany(VolunteerApplication::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ProgramParticipant::class);
    }
}
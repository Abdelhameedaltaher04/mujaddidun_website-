<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'title_ar',
        'title_en',
        'slug',
        'excerpt_ar',
        'excerpt_en',
        'description_ar',
        'description_en',
        'location_ar',
        'location_en',
        'starts_at',
        'ends_at',
        'registration_required',
        'capacity',
        'registration_starts_at',
        'registration_ends_at',
        'registration_status',
        'status',
        'cover_image_path',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_starts_at' => 'datetime',
            'registration_ends_at' => 'datetime',
            'registration_required' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }
}
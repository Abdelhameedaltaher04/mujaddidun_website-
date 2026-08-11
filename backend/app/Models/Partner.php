<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'type',
        'description_ar',
        'description_en',
        'logo_path',
        'website_url',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [];
    }
}
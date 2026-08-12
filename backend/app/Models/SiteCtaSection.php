<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteCtaSection extends Model
{
    protected $fillable = [
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'button_text_ar',
        'button_text_en',
        'button_url',
        'image_path',
        'display_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}

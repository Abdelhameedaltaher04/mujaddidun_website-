<?php

namespace Database\Seeders;

use App\Models\NewsCategory;
use Illuminate\Database\Seeder;

class NewsCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['slug' => 'announcements', 'name_ar' => 'إعلانات', 'name_en' => 'Announcements', 'sort_order' => 1],
            ['slug' => 'activities', 'name_ar' => 'أنشطة', 'name_en' => 'Activities', 'sort_order' => 2],
            ['slug' => 'programs', 'name_ar' => 'برامج', 'name_en' => 'Programs', 'sort_order' => 3],
            ['slug' => 'press', 'name_ar' => 'أخبار صحفية', 'name_en' => 'Press', 'sort_order' => 4],
        ];

        foreach ($categories as $category) {
            NewsCategory::withTrashed()->updateOrCreate(
                ['slug' => $category['slug']],
                $category + ['is_active' => true, 'deleted_at' => null],
            );
        }
    }
}

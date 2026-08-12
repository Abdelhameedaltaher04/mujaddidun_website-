<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Website Content admin module. Singleton sections (hero, about,
 * vision/mission, footer) live in the existing website_settings table as
 * content.{section} rows; repeatable content gets dedicated tables. The
 * seeded rows mirror the values previously hardcoded on the public
 * homepage so the site looks identical after switching to dynamic content.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_statistics', function (Blueprint $table): void {
            $table->id();
            $table->string('number', 20);
            $table->string('label_ar', 200);
            $table->string('label_en', 200);
            $table->string('icon', 50)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'display_order']);
        });

        Schema::create('site_cta_sections', function (Blueprint $table): void {
            $table->id();
            $table->string('title_ar', 200);
            $table->string('title_en', 200);
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->string('button_text_ar', 100)->nullable();
            $table->string('button_text_en', 100)->nullable();
            $table->string('button_url', 500)->nullable();
            $table->string('image_path', 500)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'display_order']);
        });

        Schema::create('homepage_sections', function (Blueprint $table): void {
            $table->id();
            $table->string('section_key', 50)->unique();
            $table->boolean('is_visible')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        $now = now();

        DB::table('site_statistics')->insert([
            ['number' => '10+', 'label_ar' => 'سنوات من العطاء', 'label_en' => 'Years of Giving', 'icon' => null, 'display_order' => 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['number' => '50k+', 'label_ar' => 'مستفيد سنوياً', 'label_en' => 'Beneficiaries Annually', 'icon' => null, 'display_order' => 2, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['number' => '500+', 'label_ar' => 'متطوع فاعل', 'label_en' => 'Active Volunteers', 'icon' => null, 'display_order' => 3, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['number' => '20+', 'label_ar' => 'مشروع مستدام', 'label_en' => 'Sustainable Projects', 'icon' => null, 'display_order' => 4, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('site_cta_sections')->insert([
            [
                'title_ar' => 'انضم إلى فريق مجددون وساهم في بناء مجتمع أفضل.',
                'title_en' => 'Join the Mujaddidun team and contribute to building a better community.',
                'description_ar' => 'تطوع معنا لتكون جزءاً من التغيير في مجتمعنا',
                'description_en' => 'Volunteer with us and be part of the change in our community',
                'button_text_ar' => 'انضم إلينا كمتطوع',
                'button_text_en' => 'Join as a Volunteer',
                'button_url' => '/volunteer',
                'image_path' => null,
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $sections = ['hero', 'statistics', 'about', 'programs', 'news_events', 'volunteer_cta', 'partners', 'faq', 'contact'];
        DB::table('homepage_sections')->insert(array_map(
            fn (string $key, int $index) => [
                'section_key' => $key,
                'is_visible' => true,
                'display_order' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $sections,
            array_keys($sections),
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('homepage_sections');
        Schema::dropIfExists('site_cta_sections');
        Schema::dropIfExists('site_statistics');
        DB::table('website_settings')->where('setting_key', 'like', 'content.%')->delete();
    }
};

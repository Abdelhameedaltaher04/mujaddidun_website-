<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Aligns gallery_images with the admin Gallery Management contract:
 * bilingual captions and an explicit album-cover flag.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gallery_images', function (Blueprint $table): void {
            $table->text('caption_ar')->nullable()->after('alt_text_en');
            $table->text('caption_en')->nullable()->after('caption_ar');
            $table->boolean('is_cover')->default(false)->index()->after('is_featured');
        });
    }

    public function down(): void
    {
        Schema::table('gallery_images', function (Blueprint $table): void {
            $table->dropColumn(['caption_ar', 'caption_en', 'is_cover']);
        });
    }
};

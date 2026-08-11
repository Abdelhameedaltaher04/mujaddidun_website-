<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained('news')->cascadeOnDelete();
            $table->string('image', 2048); // storage path on the public disk
            $table->string('alt_text_ar', 255)->default('');
            $table->string('alt_text_en', 255)->default('');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['news_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_images');
    }
};

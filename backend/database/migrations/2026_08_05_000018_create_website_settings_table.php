<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('setting_group', 100)->default('general');
            $table->string('setting_key', 150)->unique();
            $table->json('value_json');
            $table->enum('value_type', ['string', 'number', 'boolean', 'json'])->default('string');
            $table->boolean('is_public')->default(true);
            $table->string('description')->nullable();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['setting_group', 'is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_settings');
    }
};
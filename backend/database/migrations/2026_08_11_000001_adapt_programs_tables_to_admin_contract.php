<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Aligns the programs schema with the admin Programs Management contract
 * and adds the program_participants table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table): void {
            $table->string('category', 30)->default('education')->index()->after('description_en');
            $table->string('target_audience_ar', 150)->nullable()->after('category');
            $table->string('target_audience_en', 150)->nullable()->after('target_audience_ar');
            $table->string('location_ar', 120)->nullable()->after('target_audience_en');
            $table->string('location_en', 120)->nullable()->after('location_ar');
            $table->unsignedInteger('capacity')->nullable()->after('location_en');
            $table->text('objectives_ar')->nullable()->after('capacity');
            $table->text('objectives_en')->nullable()->after('objectives_ar');
            $table->text('requirements_ar')->nullable()->after('objectives_en');
            $table->text('requirements_en')->nullable()->after('requirements_ar');
        });

        Schema::create('program_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('full_name', 150);
            $table->string('email', 190);
            $table->string('phone', 30)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->dateTime('registered_at');
            $table->timestamps();

            $table->unique(['program_id', 'email']);
            $table->index(['program_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_participants');

        Schema::table('programs', function (Blueprint $table): void {
            $table->dropColumn([
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
            ]);
        });
    }
};

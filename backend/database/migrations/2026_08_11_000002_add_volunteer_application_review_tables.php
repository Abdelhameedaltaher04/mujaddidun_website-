<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('volunteer_applications', function (Blueprint $table): void {
            $table->string('preferred_area', 150)->nullable()->after('motivation');
            $table->text('experience')->nullable()->after('preferred_area');
            $table->text('education')->nullable()->after('experience');
            $table->string('rejection_reason', 500)->nullable()->after('review_notes');
        });

        Schema::create('volunteer_application_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('volunteer_application_id')
                ->constrained('volunteer_applications')
                ->cascadeOnDelete();
            $table->foreignId('author_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('volunteer_application_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('volunteer_application_id')
                ->constrained('volunteer_applications')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('file_path', 500);
            $table->string('mime_type', 100);
            $table->dateTime('uploaded_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('volunteer_application_documents');
        Schema::dropIfExists('volunteer_application_notes');

        Schema::table('volunteer_applications', function (Blueprint $table): void {
            $table->dropColumn(['preferred_area', 'experience', 'education', 'rejection_reason']);
        });
    }
};

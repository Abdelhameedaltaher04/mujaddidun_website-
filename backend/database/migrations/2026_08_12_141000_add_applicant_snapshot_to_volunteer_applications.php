<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Immutable snapshot of what the applicant actually submitted through the
 * public form. The unauthenticated endpoint must never overwrite the
 * stored Volunteer profile, so reapplications carry their fresh details
 * here for reviewers instead of silently losing them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('volunteer_applications', function (Blueprint $table) {
            $table->json('applicant_snapshot')->nullable()->after('experience');
        });
    }

    public function down(): void
    {
        Schema::table('volunteer_applications', function (Blueprint $table) {
            $table->dropColumn('applicant_snapshot');
        });
    }
};

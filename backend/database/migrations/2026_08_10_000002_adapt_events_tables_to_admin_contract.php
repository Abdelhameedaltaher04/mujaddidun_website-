<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aligns the events schema with the admin module contract:
 * - bilingual short descriptions (excerpts)
 * - registration window + open/closed toggle
 * - event status vocabulary draft/upcoming/ongoing/completed/cancelled
 * - registration status vocabulary pending/confirmed/cancelled/attended
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->text('excerpt_ar')->nullable()->after('slug');
            $table->text('excerpt_en')->nullable()->after('excerpt_ar');
            $table->dateTime('registration_starts_at')->nullable()->after('capacity');
            $table->dateTime('registration_ends_at')->nullable()->after('registration_starts_at');
            $table->string('registration_status', 10)->default('open')->after('registration_ends_at');
        });

        // Widen enums to plain strings so both vocabularies fit.
        Schema::table('events', function (Blueprint $table): void {
            $table->string('status', 20)->default('draft')->change();
        });
        Schema::table('event_registrations', function (Blueprint $table): void {
            $table->string('status', 20)->default('pending')->change();
        });

        DB::table('events')->where('status', 'published')->update(['status' => 'upcoming']);
        DB::table('event_registrations')->whereIn('status', ['registered', 'waitlisted'])
            ->update(['status' => 'pending']);
    }

    public function down(): void
    {
        // Map new vocabulary back onto the legacy enum values before
        // restoring the constrained column definitions.
        DB::table('events')->whereIn('status', ['upcoming', 'ongoing'])
            ->update(['status' => 'published']);
        DB::table('event_registrations')->where('status', 'pending')
            ->update(['status' => 'registered']);

        Schema::table('events', function (Blueprint $table): void {
            $table->enum('status', ['draft', 'published', 'cancelled', 'completed'])
                ->default('draft')
                ->change();
        });
        Schema::table('event_registrations', function (Blueprint $table): void {
            $table->enum('status', ['registered', 'confirmed', 'waitlisted', 'attended', 'cancelled'])
                ->default('registered')
                ->change();
        });

        Schema::table('events', function (Blueprint $table): void {
            $table->dropColumn([
                'excerpt_ar',
                'excerpt_en',
                'registration_starts_at',
                'registration_ends_at',
                'registration_status',
            ]);
        });
    }
};

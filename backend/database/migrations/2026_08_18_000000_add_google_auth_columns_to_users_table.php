<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds Google Sign-In support to the existing users table.
 *
 * `password` becomes nullable because a Google-authenticated account has no
 * password of its own — storing a random hash would leave an unusable
 * credential on the record and make "does this account have a password?"
 * impossible to answer. Existing email/password rows are untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->string('google_avatar_url')->nullable()->after('avatar_path');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['google_id']);
            $table->dropColumn(['google_id', 'google_avatar_url']);
        });

        // Rows without a password cannot satisfy a NOT NULL constraint; they are
        // Google-only accounts and are removed before the column is restored.
        \Illuminate\Support\Facades\DB::table('users')->whereNull('password')->delete();

        Schema::table('users', function (Blueprint $table): void {
            $table->string('password')->nullable(false)->change();
        });
    }
};

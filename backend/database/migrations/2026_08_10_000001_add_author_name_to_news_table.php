<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The admin UI captures a display byline (e.g. "فريق مجددون") that is not
 * necessarily a platform user; keep it alongside the author_id FK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table): void {
            $table->string('author_name', 150)->nullable()->after('author_id');
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table): void {
            $table->dropColumn('author_name');
        });
    }
};

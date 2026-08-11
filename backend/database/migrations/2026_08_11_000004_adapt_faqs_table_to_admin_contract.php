<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Aligns faqs with the admin FAQ Management contract: adds the optional
 * category used for grouping and filtering.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faqs', function (Blueprint $table): void {
            $table->string('category', 30)->nullable()->index()->after('answer_en');
        });
    }

    public function down(): void
    {
        Schema::table('faqs', function (Blueprint $table): void {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adapts contact_messages to the admin UI contract:
 * - read state becomes an explicit `read_at` timestamp (was conflated
 *   into the status enum as `read`),
 * - status becomes a plain string column with the UI vocabulary
 *   (new / in_progress / resolved / archived) — legacy enum values are
 *   normalized, and
 * - replies get their own table (message history) instead of a field.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->dateTime('read_at')->nullable()->after('status');
        });

        // Relax the legacy enum (new/read/in_progress/replied/closed/spam)
        // to a plain string so the UI vocabulary fits.
        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->string('status', 20)->default('new')->change();
        });

        // Normalize any legacy values.
        DB::table('contact_messages')->where('status', 'read')
            ->update(['status' => 'new', 'read_at' => DB::raw('updated_at')]);
        DB::table('contact_messages')->whereIn('status', ['replied', 'closed'])
            ->update(['status' => 'resolved']);
        DB::table('contact_messages')->where('status', 'spam')
            ->update(['status' => 'archived']);

        Schema::create('contact_message_replies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_message_id')
                ->constrained('contact_messages')
                ->cascadeOnDelete();
            $table->foreignId('sender_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('subject');
            $table->longText('body_html');
            $table->dateTime('sent_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_message_replies');

        Schema::table('contact_messages', function (Blueprint $table): void {
            $table->dropColumn('read_at');
        });
        // The relaxed string status column is kept on rollback (values in
        // the UI vocabulary would not fit the legacy enum).
    }
};

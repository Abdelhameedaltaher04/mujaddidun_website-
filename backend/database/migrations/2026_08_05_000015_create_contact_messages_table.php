<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('name', 200);
            $table->string('email')->index();
            $table->string('phone', 30)->nullable();
            $table->string('subject');
            $table->longText('message');
            $table->enum('status', ['new', 'read', 'in_progress', 'replied', 'closed', 'spam'])
                ->default('new')
                ->index();
            $table->text('internal_notes')->nullable();
            $table->dateTime('replied_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('donor_name', 200)->nullable();
            $table->string('donor_email')->nullable();
            $table->string('donor_phone', 30)->nullable();
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3)->default('JOD');
            $table->enum('donation_type', ['general', 'feeding', 'housing', 'empowerment', 'zakat'])
                ->default('general');
            $table->enum('frequency', ['once', 'monthly'])->default('once');
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'refunded'])
                ->default('pending')
                ->index();
            $table->string('payment_provider', 50)->nullable();
            $table->string('payment_reference')->nullable()->unique();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('refunded_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['donation_type', 'status']);
            $table->index(['donor_email', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
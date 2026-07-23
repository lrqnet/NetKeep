<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_run_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('event_id')->unique();
            $table->foreignId('collection_run_id')->constrained()->cascadeOnDelete();
            $table->timestamp('occurred_at')->index();
            $table->string('source', 32);
            $table->string('level', 16);
            $table->string('code', 64)->index();
            $table->text('technical_message')->nullable();
            $table->json('context')->nullable();
            $table->timestamps();
            $table->index(['collection_run_id', 'id']);
        });

        Schema::create('collection_run_artifacts', function (Blueprint $table): void {
            $table->uuid('uuid')->primary();
            $table->foreignId('collection_run_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->text('encrypted_path')->nullable();
            $table->string('encryption_version', 32);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('checksum', 128)->nullable();
            $table->boolean('truncated')->default(false);
            $table->timestamp('expires_at')->index();
            $table->timestamp('purged_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['collection_run_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_run_artifacts');
        Schema::dropIfExists('collection_run_events');
    }
};

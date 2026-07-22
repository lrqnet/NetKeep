<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('update_release_states', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 32)->default('never_checked');
            $table->string('etag')->nullable();
            $table->string('available_version', 32)->nullable();
            $table->string('compatibility', 32)->nullable();
            $table->text('release_url')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('assets')->nullable();
            $table->boolean('manual_eligible')->default(false);
            $table->boolean('automatic_eligible')->default(false);
            $table->boolean('rollback_safe')->default(false);
            $table->boolean('requires_host_steps')->default(false);
            $table->unsignedInteger('estimated_downtime_seconds')->default(300);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->string('last_error_code', 64)->nullable();
            $table->string('last_notified_version', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('update_operations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('backup_destination_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('snapshot_archive_id')->nullable()->constrained('backup_archives')->nullOnDelete();
            $table->string('trigger', 24);
            $table->string('status', 32)->index();
            $table->string('from_version', 32);
            $table->string('to_version', 32);
            $table->string('compatibility', 32);
            $table->string('safe_error_code', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'requested_at']);
        });

        Schema::table('backup_destinations', function (Blueprint $table): void {
            $table->boolean('is_system')->default(false)->index();
        });

        DB::table('organizations')->orderBy('id')->eachById(function (object $organization): void {
            $settings = json_decode((string) ($organization->settings ?? '{}'), true);
            $settings = is_array($settings) ? $settings : [];
            $settings['auto_update'] = false;
            data_set($settings, 'dangerous_features.automatic_updates.enabled', false);
            data_set($settings, 'dangerous_features.automatic_updates.accepted_by', null);
            data_set($settings, 'dangerous_features.automatic_updates.accepted_at', null);
            DB::table('organizations')->where('id', $organization->id)->update([
                'settings' => json_encode($settings, JSON_THROW_ON_ERROR),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('backup_destinations', function (Blueprint $table): void {
            $table->dropColumn('is_system');
        });
        Schema::dropIfExists('update_operations');
        Schema::dropIfExists('update_release_states');
    }
};

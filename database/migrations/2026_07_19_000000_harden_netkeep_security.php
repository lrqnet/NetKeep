<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('canonical_url', 2048)->nullable()->after('domain');
        });

        Schema::table('devices', function (Blueprint $table): void {
            $table->string('approval_status', 32)->default('pending')->index()->after('enabled');
            $table->string('approval_fingerprint', 64)->nullable()->after('approval_status');
            $table->foreignId('approved_by')->nullable()->after('approval_fingerprint')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->json('approved_resolved_addresses')->nullable()->after('approved_at');
            $table->text('ssh_host_key')->nullable()->after('approved_resolved_addresses');
            $table->string('ssh_host_key_fingerprint', 255)->nullable()->after('ssh_host_key');
            $table->timestamp('next_collection_at')->nullable()->index()->after('last_success_at');
            $table->timestamp('manual_cooldown_until')->nullable()->after('next_collection_at');
            $table->unsignedInteger('consecutive_failures')->default(0)->after('manual_cooldown_until');
        });

        Schema::create('collection_runs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('collection_runs')->nullOnDelete();
            $table->string('trigger', 24)->index();
            $table->string('status', 24)->index();
            $table->unsignedSmallInteger('attempt')->default(1);
            $table->smallInteger('priority')->default(0);
            $table->timestamp('scheduled_for')->index();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamp('cooldown_until')->nullable();
            $table->string('error_code', 64)->nullable();
            $table->string('engine_reference', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['device_id', 'status']);
            $table->index(['status', 'scheduled_for', 'priority']);
        });

        Schema::create('restore_operations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 24);
            $table->string('status', 32)->index();
            $table->string('archive_path', 2048)->nullable();
            $table->string('manifest_checksum', 128)->nullable();
            $table->string('rollback_path', 2048)->nullable();
            $table->string('error_code', 64)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::table('backup_archives', function (Blueprint $table): void {
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->unsignedSmallInteger('format_version')->default(2)->after('uuid');
        });

        DB::table('devices')->update([
            'enabled' => false,
            'approval_status' => 'pending',
            'status' => 'pending',
        ]);
        DB::table('custom_models')->where('source', 'raw')->update([
            'status' => 'draft',
            'published_at' => null,
        ]);

        DB::statement("CREATE UNIQUE INDEX collection_runs_one_pending_per_device ON collection_runs (device_id) WHERE status IN ('queued', 'dispatched', 'running', 'cooldown')");
        DB::statement("CREATE UNIQUE INDEX users_one_owner ON users (role) WHERE role = 'owner'");
        DB::statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_email_lower_unique');
        DB::statement('DROP INDEX IF EXISTS users_one_owner');
        DB::statement('DROP INDEX IF EXISTS collection_runs_one_pending_per_device');

        Schema::table('backup_archives', function (Blueprint $table): void {
            $table->dropUnique(['uuid']);
            $table->dropColumn(['uuid', 'format_version']);
        });

        Schema::dropIfExists('restore_operations');
        Schema::dropIfExists('collection_runs');

        Schema::table('devices', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn([
                'approval_status',
                'approval_fingerprint',
                'approved_at',
                'approved_resolved_addresses',
                'ssh_host_key',
                'ssh_host_key_fingerprint',
                'next_collection_at',
                'manual_cooldown_until',
                'consecutive_failures',
            ]);
        });

        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropColumn('canonical_url');
        });
    }
};

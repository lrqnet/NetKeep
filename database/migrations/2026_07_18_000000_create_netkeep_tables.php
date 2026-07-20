<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_path')->nullable();
            $table->string('locale', 8)->default('en');
            $table->string('timezone', 64)->default('UTC');
            $table->string('domain')->nullable();
            $table->json('settings')->nullable();
            $table->timestamp('setup_completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('device_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('remove_secrets')->default(false);
            $table->timestamps();
        });

        Schema::create('manufacturers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('website')->nullable();
            $table->timestamps();
        });

        Schema::create('hardware_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manufacturer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('oxidized_model')->nullable();
            $table->timestamps();
            $table->unique(['manufacturer_id', 'name']);
        });

        Schema::create('credential_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('username')->nullable();
            $table->text('password')->nullable();
            $table->text('enable_secret')->nullable();
            $table->text('private_key')->nullable();
            $table->text('private_key_passphrase')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('custom_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('base_model')->nullable();
            $table->string('source', 16)->default('guided');
            $table->longText('ruby_source');
            $table->json('definition')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->string('status', 24)->default('draft')->index();
            $table->text('last_validation_error')->nullable();
            $table->string('last_test_status', 24)->nullable();
            $table->text('last_test_message')->nullable();
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('inventory_sources', function (Blueprint $table) {
            $table->id();
            $table->string('type', 24);
            $table->string('name');
            $table->string('base_url');
            $table->text('token');
            $table->json('settings')->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('sync_interval')->default(900);
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
            $table->unique(['type', 'name']);
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('hostname')->nullable();
            $table->string('ip_address', 45);
            $table->unsignedInteger('port')->default(22);
            $table->string('transport', 16)->default('ssh');
            $table->string('manufacturer')->nullable();
            $table->string('hardware_model')->nullable();
            $table->string('oxidized_model');
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('credential_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('custom_model_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inventory_source_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_id')->nullable();
            $table->timestamp('external_missing_since')->nullable();
            $table->string('username_override')->nullable();
            $table->text('password_override')->nullable();
            $table->text('enable_secret_override')->nullable();
            $table->json('variables')->nullable();
            $table->unsignedInteger('backup_interval')->default(3600);
            $table->unsignedInteger('timeout')->default(20);
            $table->boolean('enabled')->default(true);
            $table->boolean('remove_secrets')->nullable();
            $table->string('status', 24)->default('pending')->index();
            $table->timestamp('last_backup_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->timestamp('overdue_alerted_at')->nullable();
            $table->text('conflict_reason')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['inventory_source_id', 'external_id']);
            $table->index(['enabled', 'status']);
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color', 16)->default('#64748b');
            $table->timestamps();
        });

        Schema::create('device_tag', function (Blueprint $table) {
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['device_id', 'tag_id']);
        });

        Schema::create('backup_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('status', 24)->index();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->string('git_commit', 64)->nullable();
            $table->boolean('changed')->default(false);
            $table->text('error')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('notification_channels', function (Blueprint $table) {
            $table->id();
            $table->string('type', 24);
            $table->string('name');
            $table->boolean('enabled')->default(true);
            $table->text('config');
            $table->json('events')->nullable();
            $table->timestamp('last_tested_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });

        Schema::create('backup_destinations', function (Blueprint $table) {
            $table->id();
            $table->string('type', 24);
            $table->string('name');
            $table->boolean('enabled')->default(true);
            $table->text('config');
            $table->timestamps();
        });

        Schema::create('backup_archives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backup_destination_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 24)->index();
            $table->string('path')->nullable();
            $table->string('encryption_mode', 24);
            $table->unsignedBigInteger('size')->nullable();
            $table->string('checksum', 128)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 96)->index();
            $table->nullableMorphs('subject');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('backup_archives');
        Schema::dropIfExists('backup_destinations');
        Schema::dropIfExists('notification_channels');
        Schema::dropIfExists('backup_runs');
        Schema::dropIfExists('device_tag');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('devices');
        Schema::dropIfExists('inventory_sources');
        Schema::dropIfExists('custom_models');
        Schema::dropIfExists('credential_profiles');
        Schema::dropIfExists('hardware_models');
        Schema::dropIfExists('manufacturers');
        Schema::dropIfExists('device_groups');
        Schema::dropIfExists('sites');
        Schema::dropIfExists('organizations');
    }
};

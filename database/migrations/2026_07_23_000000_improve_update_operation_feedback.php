<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('update_operations', function (Blueprint $table): void {
            $table->uuid('request_id')->nullable()->unique()->after('uuid');
            $table->timestamp('last_progress_at')->nullable()->after('completed_at');
            $table->timestamp('acknowledged_at')->nullable()->after('last_progress_at');
        });
        DB::table('update_operations')
            ->whereIn('status', ['succeeded', 'failed', 'recovery_required'])
            ->whereNotNull('completed_at')
            ->update(['acknowledged_at' => DB::raw('completed_at')]);
    }

    public function down(): void
    {
        Schema::table('update_operations', function (Blueprint $table): void {
            $table->dropUnique(['request_id']);
            $table->dropColumn(['request_id', 'last_progress_at', 'acknowledged_at']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backup_destinations', function (Blueprint $table) {
            $table->string('last_run_status', 24)->nullable()->after('config');
            $table->timestamp('last_run_at')->nullable()->after('last_run_status');
        });
    }

    public function down(): void
    {
        Schema::table('backup_destinations', function (Blueprint $table) {
            $table->dropColumn(['last_run_status', 'last_run_at']);
        });
    }
};

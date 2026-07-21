<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backup_runs', function (Blueprint $table): void {
            $table->foreignId('collection_run_id')
                ->nullable()
                ->after('device_id')
                ->unique()
                ->constrained('collection_runs')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('backup_runs', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('collection_run_id');
        });
    }
};

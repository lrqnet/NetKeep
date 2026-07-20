<?php

namespace App\Console\Commands;

use App\Models\InventorySource;
use App\Services\InventorySynchronizer;
use Illuminate\Console\Command;

class SyncInventoryCommand extends Command
{
    protected $signature = 'inventory:sync {source?}';

    protected $description = 'Sincroniza fontes LibreNMS e NetBox que estão vencidas';

    public function handle(InventorySynchronizer $synchronizer): int
    {
        $sources = InventorySource::query()
            ->where('enabled', true)
            ->when($this->argument('source'), fn ($query, $id) => $query->whereKey($id))
            ->get()
            ->filter(fn (InventorySource $source): bool => ! $source->last_synced_at
                || $source->last_synced_at->addSeconds($source->sync_interval)->isPast());

        foreach ($sources as $source) {
            try {
                $result = $synchronizer->sync($source);
                $this->info("{$source->name}: {$result['created']} novos, {$result['updated']} atualizados.");
            } catch (\Throwable) {
                $source->update(['last_error' => 'inventory_sync_failed']);
                $this->error("{$source->name}: falhou.");
            }
        }

        return self::SUCCESS;
    }
}

<?php

namespace App\Services;

use App\Models\BackupArchive;
use App\Models\Organization;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class BackupRetentionService
{
    public function __construct(private readonly SafeHttpClient $http) {}

    public function prune(): int
    {
        $days = (int) (Organization::query()->first()?->settings['full_backup_retention_days'] ?? 0);
        if ($days === 0) {
            return 0;
        }

        $deleted = 0;
        BackupArchive::query()
            ->with('destination')
            ->where('status', 'completed')
            ->where('completed_at', '<', now()->subDays($days))
            ->chunkById(100, function ($archives) use (&$deleted): void {
                foreach ($archives as $archive) {
                    if (! $archive->destination || ! str_starts_with((string) $archive->path, 'netkeep/')) {
                        continue;
                    }
                    if ($archive->destination->type === 'local') {
                        File::delete(rtrim((string) config('netkeep.backup_path'), '/').'/'.$archive->path);
                    } elseif ($archive->destination->type === 's3') {
                        $config = $archive->destination->config;
                        $diskConfig = [
                            'driver' => 's3',
                            'key' => $config['key'],
                            'secret' => $config['secret'],
                            'region' => $config['region'] ?? 'us-east-1',
                            'bucket' => $config['bucket'],
                            'endpoint' => $config['endpoint'] ?? null,
                            'use_path_style_endpoint' => $config['path_style'] ?? true,
                            'throw' => true,
                        ];
                        if (filled($config['endpoint'] ?? null)) {
                            $diskConfig['http'] = $this->http->options((string) $config['endpoint']);
                        }
                        Storage::build($diskConfig)->delete((string) $archive->path);
                    } else {
                        continue;
                    }
                    $archive->delete();
                    $deleted++;
                }
            });

        return $deleted;
    }
}

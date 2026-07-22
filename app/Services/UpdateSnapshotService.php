<?php

namespace App\Services;

use App\Models\BackupArchive;
use App\Models\BackupDestination;
use App\Models\UpdateOperation;
use Illuminate\Support\Facades\File;

class UpdateSnapshotService
{
    public function __construct(private readonly FullBackupService $backups) {}

    public function create(UpdateOperation $operation): BackupArchive
    {
        $destination = BackupDestination::query()->firstOrCreate(
            ['is_system' => true],
            [
                'type' => 'local',
                'name' => 'NetKeep update recovery',
                'enabled' => true,
                'config' => [
                    'encryption_mode' => 'password',
                    'password' => hash_hmac('sha256', 'netkeep-update-snapshot', (string) config('app.key')),
                ],
            ],
        );
        $archive = $this->backups->create($destination);
        $operation->update(['snapshot_archive_id' => $archive->id]);

        return $archive;
    }

    public function prune(): void
    {
        $destination = BackupDestination::query()->where('is_system', true)->first();
        if (! $destination) {
            return;
        }
        $protected = UpdateOperation::query()
            ->whereIn('status', ['failed', 'recovery_required'])
            ->whereNotNull('snapshot_archive_id')
            ->pluck('snapshot_archive_id');
        $archives = BackupArchive::query()
            ->where('backup_destination_id', $destination->id)
            ->where('status', 'completed')
            ->latest('completed_at')
            ->get();
        $keep = (int) config('netkeep.updates.snapshot_retention', 3);

        foreach ($archives->skip($keep) as $archive) {
            if ($protected->contains($archive->id)) {
                continue;
            }
            if (filled($archive->path)) {
                File::delete(rtrim((string) config('netkeep.backup_path'), '/').'/'.$archive->path);
            }
            $archive->delete();
        }
    }
}

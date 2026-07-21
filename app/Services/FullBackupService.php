<?php

namespace App\Services;

use App\Enums\BackupDestinationRunStatus;
use App\Models\BackupArchive;
use App\Models\BackupDestination;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\InputStream;
use Symfony\Component\Process\Process;

class FullBackupService
{
    public function __construct(
        private readonly BackupCrypto $crypto,
        private readonly SafeHttpClient $http,
    ) {}

    public function create(BackupDestination $destination): BackupArchive
    {
        $lock = Cache::lock("netkeep:backup:{$destination->id}", 7500);
        if (! $lock->get()) {
            throw new RuntimeException('backup_already_running');
        }

        $advisoryLocked = false;
        try {
            $advisoryLocked = $this->acquireAdvisoryLock($destination->id);
            if (! $advisoryLocked) {
                throw new RuntimeException('backup_already_running');
            }

            return $this->createLocked($destination);
        } finally {
            if ($advisoryLocked) {
                $this->releaseAdvisoryLock($destination->id);
            }
            $lock->release();
        }
    }

    private function createLocked(BackupDestination $destination): BackupArchive
    {
        $uuid = (string) Str::uuid();
        $config = $destination->config;
        $mode = $config['encryption_mode'] ?? 'password';
        $extension = $mode === 'keyfile' ? 'age' : 'nkb';
        $root = rtrim((string) config('netkeep.backup_path'), '/');
        $staging = "{$root}/.{$uuid}.{$extension}";
        $archive = BackupArchive::query()->create([
            'uuid' => $uuid,
            'format_version' => 2,
            'backup_destination_id' => $destination->id,
            'status' => 'running',
            'encryption_mode' => $mode,
            'started_at' => now(),
        ]);
        $destination->markRunStatus(BackupDestinationRunStatus::Running);

        try {
            File::ensureDirectoryExists($root, 0700, true);
            $this->assertAvailableSpace($root);
            $this->encryptArchive(
                $staging,
                $mode,
                $config,
                fn (\Closure $write): string => $this->streamArchive($write, $uuid),
            );
            $checksum = hash_file('sha256', $staging);
            $size = filesize($staging);
            if ($checksum === false || $size === false) {
                throw new RuntimeException('backup_checksum_failed');
            }

            $path = 'netkeep/'.now()->format('Y/m')."/netkeep-{$uuid}.v2.{$extension}";
            $this->upload($destination, $staging, $path);
            $archive->update([
                'status' => 'completed',
                'path' => $path,
                'size' => $size,
                'checksum' => $checksum,
                'completed_at' => now(),
                'error' => null,
            ]);
            $destination->markRunStatus(BackupDestinationRunStatus::Completed);
        } catch (\Throwable $exception) {
            File::delete([$staging, $staging.'.partial']);
            $archive->update([
                'status' => 'failed',
                'error' => 'backup_failed',
                'completed_at' => now(),
            ]);
            $destination->markRunStatus(BackupDestinationRunStatus::Failed);
            throw $exception;
        }

        return $archive;
    }

    private function streamArchive(\Closure $write, string $uuid): string
    {
        $gzip = new GzipStreamWriter($write);
        $tar = new TarStreamWriter(fn (string $chunk) => $gzip->write($chunk));
        [$databaseChunks, $databaseHash, $databaseBytes] = $this->streamDatabase($tar);
        $tar->addDirectory('repository', (string) config('netkeep.oxidized.git_path'));
        $tar->addDirectory('model', rtrim((string) config('netkeep.oxidized.config_path'), '/').'/model');
        $tar->addDirectory('branding', storage_path('app/public/branding'));
        $tar->addFile('secrets/app_key', (string) config('netkeep.app_key_path'));
        $tar->addFile('secrets/passkey_secret', (string) config('netkeep.passkey_secret_path'));

        $manifest = [
            'format' => 2,
            'archive_uuid' => $uuid,
            'netkeep_version' => config('netkeep.version'),
            'created_at' => now()->toIso8601String(),
            'compression' => 'gzip',
            'includes' => ['postgresql', 'git', 'models', 'branding', 'app_key', 'passkey_secret'],
            'database' => [
                'chunks' => $databaseChunks,
                'bytes' => $databaseBytes,
                'sha256' => $databaseHash,
            ],
            'files' => $tar->hashes(),
        ];
        $encoded = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $tar->addString('manifest.json', $encoded."\n");
        $tar->finish();
        $gzip->finish();

        return hash('sha256', $encoded."\n");
    }

    /** @return array{int,string,int} */
    private function streamDatabase(TarStreamWriter $tar): array
    {
        $process = new Process([
            'pg_dump',
            '--host='.config('database.connections.pgsql.host'),
            '--port='.config('database.connections.pgsql.port'),
            '--username='.config('database.connections.pgsql.username'),
            '--dbname='.config('database.connections.pgsql.database'),
            '--format=plain',
            '--no-owner',
            '--no-privileges',
        ]);
        $process->setEnv(['PGPASSWORD' => (string) config('database.connections.pgsql.password')]);
        $process->setTimeout(7200);
        $process->disableOutput();
        $buffer = '';
        $index = 0;
        $bytes = 0;
        $hash = hash_init('sha256');
        $process->run(function (string $type, string $data) use (&$buffer, &$index, &$bytes, $hash, $tar): void {
            if ($type !== Process::OUT) {
                return;
            }
            $bytes += strlen($data);
            hash_update($hash, $data);
            $buffer .= $data;
            while (strlen($buffer) >= 1048576) {
                $chunk = substr($buffer, 0, 1048576);
                $buffer = substr($buffer, 1048576);
                $index++;
                $tar->addString(sprintf('database/%08d.sqlpart', $index), $chunk);
            }
        });
        if (! $process->isSuccessful()) {
            throw new RuntimeException('database_dump_failed');
        }
        if ($buffer !== '' || $index === 0) {
            $index++;
            $tar->addString(sprintf('database/%08d.sqlpart', $index), $buffer);
        }

        return [$index, hash_final($hash), $bytes];
    }

    /** @param array<string, mixed> $config */
    private function encryptArchive(
        string $target,
        string $mode,
        array $config,
        \Closure $producer,
    ): string {
        $manifestChecksum = '';
        if ($mode !== 'keyfile') {
            $this->crypto->encryptStream(
                $target,
                (string) ($config['password'] ?? ''),
                function (\Closure $write) use ($producer, &$manifestChecksum): void {
                    $manifestChecksum = $producer($write);
                },
            );

            return $manifestChecksum;
        }

        $recipient = trim((string) ($config['recipient'] ?? ''));
        if (! preg_match('/^age1[0-9a-z]{58}$/', $recipient)) {
            throw new RuntimeException('age_recipient_invalid');
        }
        $temporary = $target.'.partial';
        $input = new InputStream;
        $process = new Process(['age', '--recipient', $recipient, '--output', $temporary, '-']);
        $process->setInput($input);
        $process->setTimeout(7200);
        $process->disableOutput();
        $process->start();
        try {
            $manifestChecksum = $producer(fn (string $chunk) => $input->write($chunk));
            $input->close();
            if ($process->wait() !== 0 || ! rename($temporary, $target)) {
                throw new RuntimeException('age_encryption_failed');
            }
        } finally {
            if ($process->isRunning()) {
                $process->stop(1);
            }
            File::delete($temporary);
        }

        return $manifestChecksum;
    }

    private function upload(BackupDestination $destination, string $source, string $path): void
    {
        if ($destination->type === 'local') {
            $target = rtrim((string) config('netkeep.backup_path'), '/').'/'.$path;
            File::ensureDirectoryExists(dirname($target), 0700, true);
            if (is_file($target) || ! rename($source, $target)) {
                throw new RuntimeException('backup_publish_failed');
            }

            return;
        }
        if ($destination->type !== 's3') {
            throw new RuntimeException('backup_destination_unsupported');
        }

        $config = $destination->config;
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
        $disk = Storage::build($diskConfig);
        $partial = $path.'.partial-'.$destination->id;
        $stream = fopen($source, 'rb');
        if ($stream === false) {
            throw new RuntimeException('backup_upload_open_failed');
        }
        try {
            if ($disk->fileExists($path)) {
                throw new RuntimeException('backup_destination_collision');
            }
            $disk->writeStream($partial, $stream);
            $disk->move($partial, $path);
        } catch (\Throwable $exception) {
            $disk->delete($partial);
            throw $exception;
        } finally {
            fclose($stream);
            File::delete($source);
        }
    }

    private function assertAvailableSpace(string $path): void
    {
        $free = disk_free_space($path);
        if ($free === false) {
            throw new RuntimeException('backup_space_unknown');
        }
        $databaseSize = 0;
        if (DB::getDriverName() === 'pgsql') {
            $databaseSize = (int) (DB::selectOne('SELECT pg_database_size(current_database()) AS size')->size ?? 0);
        }
        $estimated = $databaseSize
            + $this->directorySize((string) config('netkeep.oxidized.git_path'))
            + $this->directorySize(rtrim((string) config('netkeep.oxidized.config_path'), '/').'/model')
            + $this->directorySize(storage_path('app/public/branding'));
        if ($free < max(268435456, (int) ceil($estimated * 1.2))) {
            throw new RuntimeException('backup_insufficient_space');
        }
    }

    private function directorySize(string $directory): int
    {
        if (! is_dir($directory)) {
            return 0;
        }
        $size = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
        );
        foreach ($iterator as $file) {
            if ($file->isLink()) {
                throw new RuntimeException('backup_symlink_rejected');
            }
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    private function acquireAdvisoryLock(int $destinationId): bool
    {
        if (DB::getDriverName() !== 'pgsql') {
            return true;
        }

        return (bool) (DB::selectOne(
            'SELECT pg_try_advisory_lock(?) AS locked',
            [4600000000 + $destinationId],
        )->locked ?? false);
    }

    private function releaseAdvisoryLock(int $destinationId): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::selectOne('SELECT pg_advisory_unlock(?)', [4600000000 + $destinationId]);
        }
    }
}

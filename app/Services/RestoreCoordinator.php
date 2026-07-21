<?php

namespace App\Services;

use App\Models\RestoreOperation;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use PDO;
use RuntimeException;
use Symfony\Component\Process\Process;

class RestoreCoordinator
{
    public function __construct(
        private readonly BackupDecryptor $decryptor,
        private readonly BackupV2Validator $validator,
    ) {}

    public function prepare(
        string $archive,
        ?string $password,
        ?string $identity,
        ?int $requestedBy = null,
        string $source = 'cli',
    ): RestoreOperation {
        $archivePath = $this->allowedArchivePath($archive);
        $uuid = (string) Str::uuid();
        $operation = RestoreOperation::query()->create([
            'uuid' => $uuid,
            'requested_by' => $requestedBy,
            'source' => $source,
            'status' => 'preparing',
            'archive_path' => $archivePath,
            'started_at' => now(),
        ]);
        $work = $this->workPath($uuid);
        $stage = $work.'/stage';
        File::ensureDirectoryExists($stage, 0700, true);

        try {
            $extractor = new BackupV2Extractor(
                $stage,
                (int) config('netkeep.restore_max_expanded_size'),
                (int) config('netkeep.restore_max_files'),
            );
            $this->decryptor->stream(
                $archivePath,
                $password,
                $identity,
                fn (string $chunk) => $extractor->feed($chunk),
            );
            $hashes = $extractor->finish();
            $manifest = $this->validator->validate($stage, $hashes);
            $database = $this->prepareDatabase($stage, $uuid);
            $this->writeState($uuid, [
                'operation_uuid' => $uuid,
                'status' => 'prepared',
                'stage' => $stage,
                'manifest_checksum' => hash_file('sha256', $stage.'/manifest.json'),
                'archive_uuid' => $manifest['archive_uuid'],
                'current_database' => (string) config('database.connections.pgsql.database'),
                'temporary_database' => $database,
                'rollback_database' => null,
                'previous_paths' => [],
            ]);
            $operation->update([
                'status' => 'prepared',
                'manifest_checksum' => hash_file('sha256', $stage.'/manifest.json'),
                'rollback_path' => $work.'/previous',
            ]);
        } catch (\Throwable $exception) {
            $operation->update([
                'status' => 'failed',
                'error_code' => 'restore_prepare_failed',
                'completed_at' => now(),
            ]);
            File::deleteDirectory($work);
            throw $exception;
        }

        return $operation->refresh();
    }

    public function apply(string $uuid): void
    {
        $state = $this->readState($uuid);
        if (($state['status'] ?? null) !== 'prepared') {
            throw new RuntimeException('restore_not_prepared');
        }
        $marker = $this->maintenanceMarker();
        File::put($marker, $uuid, true);
        Artisan::call('down', ['--retry' => 60]);
        $this->waitForQuiescence();

        try {
            $state['status'] = 'applying';
            $this->writeState($uuid, $state);
            $state['previous_paths'] = $this->stageDirectories($state['stage'], $uuid);
            $this->writeState($uuid, $state);
            $this->backupCurrentSecrets($uuid);
            $rollbackDatabase = $this->swapDatabase(
                $state['current_database'],
                $state['temporary_database'],
                $uuid,
            );
            $state['rollback_database'] = $rollbackDatabase;
            $this->writeState($uuid, $state);
            $this->activateDirectories($state['previous_paths']);
            $this->activateSecrets($state['stage']);
            $state['status'] = 'applied';
            $this->writeState($uuid, $state);
            File::deleteDirectory((string) $state['stage']);
        } catch (\Throwable $exception) {
            $this->rollbackState($uuid, $state);
            throw $exception;
        }
    }

    public function rollback(string $uuid): void
    {
        $state = $this->readState($uuid);
        if (! in_array($state['status'] ?? null, ['applied', 'applying', 'failed'], true)) {
            throw new RuntimeException('restore_cannot_rollback');
        }
        $this->rollbackState($uuid, $state);
    }

    public function finalize(string $uuid): void
    {
        $state = $this->readState($uuid);
        if (($state['status'] ?? null) !== 'applied') {
            throw new RuntimeException('restore_not_applied');
        }
        try {
            $this->assertCurrentHealth((string) $state['current_database']);
        } catch (\Throwable $exception) {
            $this->rollbackState($uuid, $state);
            throw $exception;
        }
        if (filled($state['rollback_database'] ?? null)) {
            $this->dropDatabase((string) $state['rollback_database']);
        }
        foreach ((array) ($state['previous_paths'] ?? []) as $paths) {
            if (is_array($paths) && filled($paths['previous'] ?? null)) {
                File::deleteDirectory((string) $paths['previous']);
            }
        }
        File::deleteDirectory($this->workPath($uuid).'/previous');
        $state['status'] = 'completed';
        $this->writeState($uuid, $state);
        File::delete($this->maintenanceMarker());
        Artisan::call('up');
        RestoreOperation::query()->where('uuid', $uuid)->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    private function prepareDatabase(string $stage, string $uuid): string
    {
        $suffix = substr(str_replace('-', '', $uuid), 0, 16);
        $database = 'netkeep_restore_'.$suffix;
        $role = 'netkeep_restore_role_'.substr($suffix, 0, 12);
        $password = bin2hex(random_bytes(32));
        $this->adminSql(
            'CREATE ROLE '.$this->identifier($role)." LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD '"
            .str_replace("'", "''", $password)."';",
        );
        $this->adminSql(
            'ALTER ROLE '.$this->identifier($role).' SET temp_file_limit = 4194304;',
        );

        try {
            $this->adminSql(
                'CREATE DATABASE '.$this->identifier($database).' OWNER '.$this->identifier($role).';',
            );
            $this->restoreDatabaseChunks($stage, $database, $role, $password);
            $this->validateTemporaryDatabase($stage, $database, $role, $password);
            $reassign = $this->adminDatabaseProcess($database, [
                '--command=REASSIGN OWNED BY '.$this->identifier($role).' TO '
                .$this->identifier((string) config('database.connections.pgsql.username')).';',
            ]);
            $reassign->mustRun();
            $this->adminSql(
                'ALTER DATABASE '.$this->identifier($database).' OWNER TO '
                .$this->identifier((string) config('database.connections.pgsql.username')).';',
            );
            $this->adminSql('DROP ROLE '.$this->identifier($role).';');
        } catch (\Throwable $exception) {
            $this->dropDatabase($database);
            $this->adminSql('DROP ROLE IF EXISTS '.$this->identifier($role).';');
            throw $exception;
        }

        return $database;
    }

    private function restoreDatabaseChunks(string $stage, string $database, string $role, string $password): void
    {
        $command = [
            'psql',
            '--host='.config('database.connections.pgsql.host'),
            '--port='.config('database.connections.pgsql.port'),
            '--username='.$role,
            '--dbname='.$database,
            '--set=ON_ERROR_STOP=1',
            '--single-transaction',
        ];
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['file', '/dev/null', 'a'],
            2 => ['file', '/dev/null', 'a'],
        ];
        $process = proc_open($command, $descriptors, $pipes, null, [
            'PGPASSWORD' => $password,
            'PGOPTIONS' => '-c statement_timeout=1800000 -c lock_timeout=30000',
            'LD_LIBRARY_PATH' => (string) getenv('LD_LIBRARY_PATH'),
            'PATH' => '/usr/local/bin:/usr/bin:/bin',
        ]);
        if (! is_resource($process)) {
            throw new RuntimeException('restore_database_process_failed');
        }
        try {
            foreach (glob($stage.'/database/*.sqlpart') ?: [] as $chunkPath) {
                $input = fopen($chunkPath, 'rb');
                if ($input === false) {
                    throw new RuntimeException('restore_database_chunk_unreadable');
                }
                try {
                    while (! feof($input)) {
                        $chunk = fread($input, 1048576);
                        if ($chunk === false) {
                            throw new RuntimeException('restore_database_chunk_unreadable');
                        }
                        $this->writePipe($pipes[0], $chunk);
                    }
                } finally {
                    fclose($input);
                }
            }
            fclose($pipes[0]);
            $exit = proc_close($process);
            $process = null;
            if ($exit !== 0) {
                throw new RuntimeException('restore_database_import_failed');
            }
        } finally {
            if (is_resource($process)) {
                if (isset($pipes[0]) && is_resource($pipes[0])) {
                    fclose($pipes[0]);
                }
                proc_terminate($process);
                proc_close($process);
            }
        }
    }

    private function validateTemporaryDatabase(
        string $stage,
        string $database,
        string $role,
        string $password,
    ): void {
        $pdo = new PDO(
            'pgsql:host='.config('database.connections.pgsql.host')
            .';port='.config('database.connections.pgsql.port')
            .';dbname='.$database,
            $role,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
        foreach (['users', 'organizations', 'devices', 'migrations'] as $table) {
            $statement = $pdo->prepare('SELECT to_regclass(?)');
            $statement->execute(['public.'.$table]);
            if ($statement->fetchColumn() === null) {
                throw new RuntimeException('restore_database_schema_invalid');
            }
        }
        if ((int) $this->queryValue($pdo, "SELECT COUNT(*) FROM users WHERE role = 'owner'") !== 1) {
            throw new RuntimeException('restore_owner_invariant_invalid');
        }
        $duplicateEmails = (int) $this->queryValue(
            $pdo,
            'SELECT COUNT(*) FROM (SELECT LOWER(email) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1) duplicates',
        );
        if ($duplicateEmails !== 0) {
            throw new RuntimeException('restore_email_invariant_invalid');
        }

        $payload = $this->queryValue(
            $pdo,
            'SELECT password FROM credential_profiles WHERE password IS NOT NULL LIMIT 1',
        );
        if (is_string($payload) && $payload !== '') {
            $appKey = trim(File::get($stage.'/secrets/app_key'));
            $key = base64_decode(substr($appKey, 7), true);
            if ($key === false) {
                throw new RuntimeException('restore_app_key_invalid');
            }
            (new Encrypter($key, 'AES-256-CBC'))->decrypt($payload, false);
        }
    }

    /** @return array<string, array<string, mixed>> */
    private function stageDirectories(string $stage, string $uuid): array
    {
        return [
            'repository' => $this->stageMountContents(
                $stage.'/repository',
                (string) config('netkeep.oxidized.git_path'),
                $uuid,
            ),
            'models' => $this->stageDirectory(
                $stage.'/model',
                rtrim((string) config('netkeep.oxidized.config_path'), '/').'/model',
                $uuid,
            ),
            'branding' => $this->stageDirectory(
                $stage.'/branding',
                storage_path('app/public/branding'),
                $uuid,
            ),
        ];
    }

    /** @return array<string, mixed> */
    private function stageMountContents(string $source, string $destination, string $uuid): array
    {
        File::ensureDirectoryExists($destination, 0770, true);
        $incoming = $destination.'/.netkeep-incoming-'.$uuid;
        $previous = $destination.'/.netkeep-previous-'.$uuid;
        File::ensureDirectoryExists($source, 0700, true);
        File::copyDirectory($source, $incoming);
        File::ensureDirectoryExists($previous, 0700, true);

        return compact('source', 'destination', 'incoming', 'previous') + ['mount' => true];
    }

    /** @return array<string, mixed> */
    private function stageDirectory(string $source, string $destination, string $uuid): array
    {
        File::ensureDirectoryExists($source, 0700, true);
        File::ensureDirectoryExists(dirname($destination), 0770, true);
        $incoming = $destination.'.netkeep-incoming-'.$uuid;
        $previous = $destination.'.netkeep-previous-'.$uuid;
        $hadDestination = is_dir($destination);
        File::copyDirectory($source, $incoming);

        return compact('source', 'destination', 'incoming', 'previous', 'hadDestination') + ['mount' => false];
    }

    /** @param array<string, array<string, mixed>> $paths */
    private function activateDirectories(array $paths): void
    {
        foreach ($paths as $name => $item) {
            if ($item['mount']) {
                $this->activateMountContents($item);
            } else {
                if (is_dir($item['destination']) && ! rename($item['destination'], $item['previous'])) {
                    throw new RuntimeException('restore_directory_swap_failed');
                }
                if (! rename($item['incoming'], $item['destination'])) {
                    throw new RuntimeException('restore_directory_swap_failed');
                }
            }
            $uid = $name === 'branding' ? 20000 : 30000;
            $gid = $name === 'branding' ? 20000 : 30000;
            $this->setOwnership($item['destination'], $uid, $gid);
        }
    }

    /** @param array<string, mixed> $item */
    private function activateMountContents(array $item): void
    {
        foreach (new \FilesystemIterator($item['destination'], \FilesystemIterator::SKIP_DOTS) as $entry) {
            if (! $entry instanceof \SplFileInfo) {
                continue;
            }
            if (in_array($entry->getFilename(), [basename($item['incoming']), basename($item['previous'])], true)) {
                continue;
            }
            if (! rename($entry->getPathname(), $item['previous'].'/'.$entry->getFilename())) {
                throw new RuntimeException('restore_directory_swap_failed');
            }
        }
        foreach (new \FilesystemIterator($item['incoming'], \FilesystemIterator::SKIP_DOTS) as $entry) {
            if (! $entry instanceof \SplFileInfo) {
                continue;
            }
            if (! rename($entry->getPathname(), $item['destination'].'/'.$entry->getFilename())) {
                throw new RuntimeException('restore_directory_swap_failed');
            }
        }
        File::deleteDirectory($item['incoming']);
    }

    private function backupCurrentSecrets(string $uuid): void
    {
        $target = $this->workPath($uuid).'/previous/secrets';
        File::ensureDirectoryExists($target, 0700, true);
        foreach (['app_key', 'passkey_secret', 'oxidized_token', 'app.env'] as $name) {
            File::copy('/run/netkeep-secrets/'.$name, $target.'/'.$name);
        }
        File::copy(
            rtrim((string) config('netkeep.oxidized.config_path'), '/').'/config',
            $target.'/oxidized_config',
        );
        File::copy(
            rtrim((string) config('netkeep.sandbox.config_path'), '/').'/config',
            $target.'/sandbox_config',
        );
    }

    private function activateSecrets(string $stage): void
    {
        $appKey = trim(File::get($stage.'/secrets/app_key'));
        $passkey = trim(File::get($stage.'/secrets/passkey_secret'));
        $token = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $this->atomicWrite('/run/netkeep-secrets/app_key', $appKey."\n", 0640);
        $this->atomicWrite('/run/netkeep-secrets/passkey_secret', $passkey."\n", 0640);
        $this->atomicWrite('/run/netkeep-secrets/oxidized_token', $token."\n", 0640);

        $environment = File::get('/run/netkeep-secrets/app.env');
        $environment = $this->replaceEnvironment($environment, 'APP_KEY', $appKey);
        $environment = $this->replaceEnvironment($environment, 'PASSKEYS_USER_HANDLE_SECRET', $passkey);
        $environment = $this->replaceEnvironment($environment, 'OXIDIZED_INTERNAL_TOKEN', $token);
        $this->atomicWrite('/run/netkeep-secrets/app.env', $environment, 0640);
        foreach ([
            rtrim((string) config('netkeep.oxidized.config_path'), '/').'/config',
            rtrim((string) config('netkeep.sandbox.config_path'), '/').'/config',
        ] as $path) {
            $configuration = File::get($path);
            $configuration = preg_replace(
                "/(X-NetKeep-Token:\\s*)'[^']*'/",
                "$1'{$token}'",
                $configuration,
            );
            if (! is_string($configuration)) {
                throw new RuntimeException('restore_token_rotation_failed');
            }
            $this->atomicWrite($path, $configuration, 0640, 30000);
        }
    }

    private function swapDatabase(string $current, string $temporary, string $uuid): string
    {
        $rollback = 'netkeep_previous_'.substr(str_replace('-', '', $uuid), 0, 16);
        DB::disconnect();
        $this->adminSql(
            'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('
            ."'".str_replace("'", "''", $current)."','".str_replace("'", "''", $temporary)."'"
            .') AND pid <> pg_backend_pid();',
        );
        $this->adminSql(
            'ALTER DATABASE '.$this->identifier($current).' RENAME TO '.$this->identifier($rollback).';',
        );
        $this->adminSql(
            'ALTER DATABASE '.$this->identifier($temporary).' RENAME TO '.$this->identifier($current).';',
        );

        return $rollback;
    }

    /** @param array<string, mixed> $state */
    private function rollbackState(string $uuid, array $state): void
    {
        try {
            $rollback = (string) ($state['rollback_database'] ?? '');
            if ($rollback !== '') {
                $failed = 'netkeep_failed_'.substr(str_replace('-', '', $uuid), 0, 16);
                $this->adminSql(
                    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('
                    ."'".str_replace("'", "''", $state['current_database'])."','"
                    .str_replace("'", "''", $rollback)."'"
                    .') AND pid <> pg_backend_pid();',
                );
                $this->adminSql(
                    'ALTER DATABASE '.$this->identifier($state['current_database']).' RENAME TO '
                    .$this->identifier($failed).';',
                );
                $this->adminSql(
                    'ALTER DATABASE '.$this->identifier($rollback).' RENAME TO '
                    .$this->identifier($state['current_database']).';',
                );
                $this->dropDatabase($failed);
            }
            $this->restoreDirectories((array) ($state['previous_paths'] ?? []));
            $this->restoreSecrets($uuid);
            $state['status'] = 'rolled_back';
            $this->writeState($uuid, $state);
            if (filled($state['stage'] ?? null)) {
                File::deleteDirectory((string) $state['stage']);
            }
            RestoreOperation::query()->where('uuid', $uuid)->update([
                'status' => 'rolled_back',
                'completed_at' => now(),
            ]);
        } finally {
            File::delete($this->maintenanceMarker());
            Artisan::call('up');
        }
    }

    /** @param array<string, array<string, mixed>> $paths */
    private function restoreDirectories(array $paths): void
    {
        foreach ($paths as $item) {
            if ($item['mount']) {
                if (! is_dir((string) ($item['previous'] ?? ''))) {
                    continue;
                }
                foreach (new \FilesystemIterator($item['destination'], \FilesystemIterator::SKIP_DOTS) as $entry) {
                    if (! $entry instanceof \SplFileInfo) {
                        continue;
                    }
                    if ($entry->getPathname() === $item['previous']) {
                        continue;
                    }
                    $entry->isDir()
                        ? File::deleteDirectory($entry->getPathname())
                        : File::delete($entry->getPathname());
                }
                foreach (new \FilesystemIterator($item['previous'], \FilesystemIterator::SKIP_DOTS) as $entry) {
                    if (! $entry instanceof \SplFileInfo) {
                        continue;
                    }
                    rename($entry->getPathname(), $item['destination'].'/'.$entry->getFilename());
                }
                File::deleteDirectory($item['previous']);
            } else {
                File::deleteDirectory($item['destination']);
                if (($item['hadDestination'] ?? false) && is_dir($item['previous'])) {
                    rename($item['previous'], $item['destination']);
                }
            }
        }
    }

    private function restoreSecrets(string $uuid): void
    {
        $source = $this->workPath($uuid).'/previous/secrets';
        if (! is_dir($source)) {
            return;
        }
        foreach (['app_key', 'passkey_secret', 'oxidized_token', 'app.env'] as $name) {
            $this->atomicWrite('/run/netkeep-secrets/'.$name, File::get($source.'/'.$name), 0640);
        }
        $this->atomicWrite(
            rtrim((string) config('netkeep.oxidized.config_path'), '/').'/config',
            File::get($source.'/oxidized_config'),
            0640,
            30000,
        );
        $this->atomicWrite(
            rtrim((string) config('netkeep.sandbox.config_path'), '/').'/config',
            File::get($source.'/sandbox_config'),
            0640,
            30000,
        );
    }

    private function assertCurrentHealth(string $database): void
    {
        $process = $this->databaseProcess($database, [
            '--tuples-only',
            '--command=SELECT COUNT(*) FROM users WHERE role = \'owner\';',
        ]);
        $process->mustRun();
        if (trim($process->getOutput()) !== '1') {
            throw new RuntimeException('restore_health_check_failed');
        }
        if (
            ! is_dir((string) config('netkeep.oxidized.git_path').'/.git')
            || ! is_file((string) config('netkeep.app_key_path'))
            || ! is_file((string) config('netkeep.passkey_secret_path'))
        ) {
            throw new RuntimeException('restore_health_check_failed');
        }
    }

    private function waitForQuiescence(): void
    {
        $deadline = time() + 300;
        do {
            $activeCollections = DB::table('collection_runs')
                ->whereIn('status', ['dispatched', 'running'])
                ->count();
            $reservedJobs = DB::table('jobs')->whereNotNull('reserved_at')->count();
            if ($activeCollections === 0 && $reservedJobs === 0) {
                return;
            }
            sleep(1);
        } while (time() < $deadline);

        throw new RuntimeException('restore_quiescence_timeout');
    }

    private function adminSql(string $sql): void
    {
        $process = $this->adminDatabaseProcess('postgres', ['--command='.$sql]);
        $process->setTimeout(300);
        $process->mustRun();
    }

    /** @param list<string> $arguments */
    private function databaseProcess(string $database, array $arguments): Process
    {
        $process = new Process([
            'psql',
            '--host='.config('database.connections.pgsql.host'),
            '--port='.config('database.connections.pgsql.port'),
            '--username='.config('database.connections.pgsql.username'),
            '--dbname='.$database,
            '--set=ON_ERROR_STOP=1',
            ...$arguments,
        ]);
        $process->setEnv(['PGPASSWORD' => (string) config('database.connections.pgsql.password')]);

        return $process;
    }

    /** @param list<string> $arguments */
    private function adminDatabaseProcess(string $database, array $arguments): Process
    {
        $process = new Process([
            'psql',
            '--host='.config('database.connections.pgsql.host'),
            '--port='.config('database.connections.pgsql.port'),
            '--username='.config('netkeep.database_admin.username'),
            '--dbname='.$database,
            '--set=ON_ERROR_STOP=1',
            ...$arguments,
        ]);
        $process->setEnv([
            'PGPASSWORD' => trim(File::get((string) config('netkeep.database_admin.password_path'))),
        ]);

        return $process;
    }

    private function dropDatabase(string $database): void
    {
        $this->adminSql(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '"
            .str_replace("'", "''", $database)."' AND pid <> pg_backend_pid();",
        );
        $this->adminSql('DROP DATABASE IF EXISTS '.$this->identifier($database).';');
    }

    private function identifier(string $value): string
    {
        if (! preg_match('/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/', $value)) {
            throw new RuntimeException('restore_database_identifier_invalid');
        }

        return '"'.$value.'"';
    }

    /** @param resource $pipe */
    private function writePipe($pipe, string $content): void
    {
        $offset = 0;
        while ($offset < strlen($content)) {
            $written = fwrite($pipe, substr($content, $offset));
            if ($written === false || $written === 0) {
                throw new RuntimeException('restore_database_pipe_failed');
            }
            $offset += $written;
        }
    }

    private function setOwnership(string $path, int $uid, int $gid): void
    {
        if (! file_exists($path)) {
            return;
        }
        chown($path, $uid);
        chgrp($path, $gid);
        if (! is_dir($path)) {
            return;
        }
        foreach (new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        ) as $entry) {
            chown($entry->getPathname(), $uid);
            chgrp($entry->getPathname(), $gid);
        }
    }

    private function atomicWrite(string $target, string $content, int $mode, int $uid = 0): void
    {
        $temporary = $target.'.'.bin2hex(random_bytes(8)).'.partial';
        if (File::put($temporary, $content, true) === false) {
            throw new RuntimeException('restore_atomic_write_failed');
        }
        chmod($temporary, $mode);
        chown($temporary, $uid);
        chgrp($temporary, $uid === 30000 ? 30000 : 20000);
        if (! rename($temporary, $target)) {
            File::delete($temporary);
            throw new RuntimeException('restore_atomic_write_failed');
        }
    }

    private function replaceEnvironment(string $environment, string $key, string $value): string
    {
        $line = $key.'='.$value;
        $updated = preg_replace('/^'.preg_quote($key, '/').'=[^\r\n]*$/m', $line, $environment, 1, $count);
        if (! is_string($updated)) {
            throw new RuntimeException('restore_environment_update_failed');
        }

        return $count === 1 ? $updated : rtrim($updated)."\n{$line}\n";
    }

    private function allowedArchivePath(string $archive): string
    {
        $path = realpath($archive);
        if ($path === false || ! is_file($path)) {
            throw new RuntimeException('restore_archive_missing');
        }
        foreach ([(string) config('netkeep.restore_inbox'), (string) config('netkeep.backup_path')] as $root) {
            $resolved = realpath($root);
            if ($resolved !== false && str_starts_with($path, rtrim($resolved, '/').'/')) {
                return $path;
            }
        }

        throw new RuntimeException('restore_archive_location_rejected');
    }

    private function workPath(string $uuid): string
    {
        if (! preg_match('/^[0-9a-f-]{36}$/i', $uuid)) {
            throw new RuntimeException('restore_operation_invalid');
        }

        return rtrim((string) config('netkeep.restore_inbox'), '/').'/.operations/'.$uuid;
    }

    private function statePath(string $uuid): string
    {
        return $this->workPath($uuid).'/state.json';
    }

    /** @param array<string, mixed> $state */
    private function writeState(string $uuid, array $state): void
    {
        File::ensureDirectoryExists($this->workPath($uuid), 0700, true);
        $target = $this->statePath($uuid);
        $temporary = $target.'.partial';
        File::put($temporary, json_encode($state, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), true);
        chmod($temporary, 0600);
        rename($temporary, $target);
    }

    /** @return array<string, mixed> */
    private function readState(string $uuid): array
    {
        $path = $this->statePath($uuid);
        if (! is_file($path)) {
            throw new RuntimeException('restore_state_missing');
        }
        $state = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($state) || ($state['operation_uuid'] ?? null) !== $uuid) {
            throw new RuntimeException('restore_state_invalid');
        }

        return $state;
    }

    private function maintenanceMarker(): string
    {
        return rtrim((string) config('netkeep.restore_inbox'), '/').'/.maintenance';
    }

    private function queryValue(PDO $pdo, string $sql): mixed
    {
        $statement = $pdo->query($sql);
        if ($statement === false) {
            throw new RuntimeException('restore_database_query_failed');
        }

        return $statement->fetchColumn();
    }
}

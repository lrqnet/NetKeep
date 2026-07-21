<?php

namespace App\Console\Commands;

use App\Services\InstallationClaimService;
use App\Services\RestoreCoordinator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;

class RestoreFullBackupCommand extends Command
{
    protected $signature = 'netkeep:restore
        {action : prepare, apply, rollback or finalize}
        {archive? : Archive path for prepare}
        {--operation= : Restore operation UUID}
        {--password-file= : File containing the recovery password}
        {--identity= : age identity file}
        {--web-request= : UUID of a staged web restore request}
        {--force : Confirm state-changing phases}';

    protected $description = 'Prepare, apply, roll back or finalize a portable NetKeep restore';

    public function handle(
        RestoreCoordinator $restores,
        InstallationClaimService $claims,
    ): int {
        try {
            return match ((string) $this->argument('action')) {
                'prepare' => $this->prepare($restores, $claims),
                'apply' => $this->changeState($restores, $claims, 'apply'),
                'rollback' => $this->changeState($restores, $claims, 'rollback'),
                'finalize' => $this->changeState($restores, $claims, 'finalize'),
                default => $this->invalidAction(),
            };
        } catch (\Throwable $exception) {
            $this->error('Restore failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }

    private function prepare(
        RestoreCoordinator $restores,
        InstallationClaimService $claims,
    ): int {
        $webRequest = $this->option('web-request');
        $requestPath = null;
        $requestedBy = null;
        $archive = (string) $this->argument('archive');
        $identity = $this->option('identity') ? (string) $this->option('identity') : null;
        $password = null;
        if ($webRequest) {
            $request = $this->readWebRequest((string) $webRequest);
            $requestPath = $request['path'];
            $archive = $request['archive'];
            $identity = $request['identity'];
            $requestedBy = $request['requested_by'];
            $password = $request['password'] === null
                ? null
                : Crypt::decryptString($request['password']);
        }
        if ($archive === '') {
            $this->error('The archive path is required for prepare.');

            return self::FAILURE;
        }
        if ($password === null && $passwordFile = $this->option('password-file')) {
            $path = realpath((string) $passwordFile);
            if ($path === false || ! is_file($path)) {
                $this->error('The password file is invalid.');

                return self::FAILURE;
            }
            $password = trim(File::get($path));
        }
        $operation = $restores->prepare(
            $archive,
            $password,
            $identity,
            $requestedBy,
            $webRequest ? 'web' : 'cli',
        );
        if (is_string($password)) {
            sodium_memzero($password);
        }
        if ($requestPath !== null) {
            File::delete($requestPath);
            if ($identity !== null) {
                File::delete($identity);
            }
            if ($requestedBy === null) {
                $claims->invalidate();
            }
        }
        $this->info('Restore prepared: '.$operation->uuid);

        return self::SUCCESS;
    }

    private function changeState(
        RestoreCoordinator $restores,
        InstallationClaimService $claims,
        string $action,
    ): int {
        $uuid = (string) $this->option('operation');
        if ($uuid === '' || ! $this->option('force')) {
            $this->error('Use --operation=<uuid> and --force.');

            return self::FAILURE;
        }
        $restores->{$action}($uuid);
        if ($action === 'finalize') {
            $claims->invalidate();
        }
        $this->info("Restore {$action} completed for {$uuid}.");

        return self::SUCCESS;
    }

    private function invalidAction(): int
    {
        $this->error('Action must be prepare, apply, rollback or finalize.');

        return self::FAILURE;
    }

    /**
     * @return array{
     *     path:string,
     *     archive:string,
     *     password:string|null,
     *     identity:string|null,
     *     requested_by:int|null
     * }
     */
    private function readWebRequest(string $uuid): array
    {
        if (! preg_match('/^[0-9a-f-]{36}$/i', $uuid)) {
            throw new \RuntimeException('restore_request_invalid');
        }
        $path = rtrim((string) config('netkeep.restore_inbox'), '/')
            ."/.restore-request-{$uuid}.json";
        if (! is_file($path)) {
            throw new \RuntimeException('restore_request_missing');
        }
        $payload = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($payload) || ($payload['uuid'] ?? null) !== $uuid) {
            throw new \RuntimeException('restore_request_invalid');
        }

        return [
            'path' => $path,
            'archive' => (string) ($payload['archive'] ?? ''),
            'password' => is_string($payload['password'] ?? null) ? $payload['password'] : null,
            'identity' => is_string($payload['identity'] ?? null) ? $payload['identity'] : null,
            'requested_by' => is_int($payload['requested_by'] ?? null) ? $payload['requested_by'] : null,
        ];
    }
}

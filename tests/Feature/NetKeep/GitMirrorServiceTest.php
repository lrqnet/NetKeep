<?php

namespace Tests\Feature\NetKeep;

use App\Models\BackupDestination;
use App\Services\GitMirrorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class GitMirrorServiceTest extends TestCase
{
    use RefreshDatabase;

    protected bool $withCompletedSetup = false;

    public function test_token_authentication_never_places_the_secret_in_process_arguments(): void
    {
        $work = storage_path('framework/testing/git-mirror-'.Str::uuid());
        $repository = $work.'/repository';
        $bin = $work.'/bin';
        $arguments = $work.'/arguments';
        $header = $work.'/header';
        File::ensureDirectoryExists($repository.'/.git');
        File::ensureDirectoryExists($bin);
        File::put(
            $bin.'/git',
            "#!/bin/sh\n"
            ."printf '%s\\n' \"\$@\" > ".escapeshellarg($arguments)."\n"
            ."printf '%s' \"\${GIT_CONFIG_VALUE_0:-}\" > ".escapeshellarg($header)."\n"
            ."exit 0\n",
        );
        chmod($bin.'/git', 0755);

        $originalPath = (string) getenv('PATH');
        putenv('PATH='.$bin.':'.$originalPath);
        config(['netkeep.oxidized.git_path' => $repository]);

        $destination = BackupDestination::query()->create([
            'type' => 'git',
            'name' => 'Private mirror',
            'enabled' => true,
            'config' => [
                'url' => 'https://198.51.100.10/private/netkeep.git',
                'auth_type' => 'token',
                'token' => 'github-secret-token',
            ],
        ]);

        try {
            app(GitMirrorService::class)->mirror($destination);

            $this->assertStringNotContainsString('github-secret-token', File::get($arguments));
            $this->assertStringContainsString(
                'https://198.51.100.10/private/netkeep.git',
                File::get($arguments),
            );
            $this->assertSame(
                'Authorization: Basic '.base64_encode('oauth2:github-secret-token'),
                File::get($header),
            );
            $this->assertSame(
                'completed',
                $destination->refresh()->last_run_status?->value,
            );
        } finally {
            putenv('PATH='.$originalPath);
            File::deleteDirectory($work);
        }
    }

    public function test_failed_mirror_records_only_a_safe_failure_status(): void
    {
        $work = storage_path('framework/testing/git-mirror-'.Str::uuid());
        $repository = $work.'/repository';
        $bin = $work.'/bin';
        File::ensureDirectoryExists($repository.'/.git');
        File::ensureDirectoryExists($bin);
        File::put($bin.'/git', "#!/bin/sh\nexit 1\n");
        chmod($bin.'/git', 0755);

        $originalPath = (string) getenv('PATH');
        putenv('PATH='.$bin.':'.$originalPath);
        config(['netkeep.oxidized.git_path' => $repository]);

        $destination = BackupDestination::query()->create([
            'type' => 'git',
            'name' => 'Private mirror',
            'enabled' => true,
            'config' => [
                'url' => 'https://198.51.100.10/private/netkeep.git',
                'auth_type' => 'token',
                'token' => 'example-secret-token',
            ],
        ]);

        try {
            app(GitMirrorService::class)->mirror($destination);
            $this->fail('The mirror should fail.');
        } catch (\Throwable) {
            $this->assertSame(
                'failed',
                $destination->refresh()->last_run_status?->value,
            );
        } finally {
            putenv('PATH='.$originalPath);
            File::deleteDirectory($work);
        }
    }
}

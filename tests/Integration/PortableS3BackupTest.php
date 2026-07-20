<?php

namespace Tests\Integration;

use App\Enums\UserRole;
use App\Models\BackupDestination;
use App\Models\Site;
use App\Models\User;
use App\Services\BackupDecryptor;
use App\Services\BackupV2Extractor;
use App\Services\BackupV2Validator;
use App\Services\FullBackupService;
use App\Services\SafeHttpClient;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PortableS3BackupTest extends TestCase
{
    private const ARCHIVE = '/var/lib/netkeep/restore-inbox/e2e-s3-backup.nkb';

    private const PASSWORD_FILE = '/var/lib/netkeep/restore-inbox/e2e-s3-password';

    private const PASSWORD = 'NetKeep E2E recovery password only';

    protected function setUp(): void
    {
        if (! filter_var(getenv('NETKEEP_INTEGRATION_TESTS'), FILTER_VALIDATE_BOOL)) {
            $this->markTestSkipped('External service integration tests are disabled.');
        }

        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Portable backup integration requires PostgreSQL.');
        }

        Http::swap(new Factory);
    }

    public function test_s3_upload_download_decryption_and_restore_validation(): void
    {
        User::query()->where('role', UserRole::Owner)->first()
            ?? User::factory()->create([
                'name' => 'NetKeep E2E Owner',
                'email' => 'owner-e2e@netkeep.invalid',
                'role' => UserRole::Owner,
            ]);
        Site::query()->whereIn('name', ['E2E preserved site', 'E2E transient site'])->delete();
        Site::query()->create(['name' => 'E2E preserved site']);

        $repository = (string) config('netkeep.oxidized.git_path');
        $model = rtrim((string) config('netkeep.oxidized.config_path'), '/').'/model';
        $branding = storage_path('app/public/branding');
        File::ensureDirectoryExists($repository, 0770, true);
        File::ensureDirectoryExists($model, 0770, true);
        File::ensureDirectoryExists($branding, 0770, true);
        File::put($repository.'/e2e-configuration', 'hostname e2e-preserved');
        File::put($model.'/e2e.rb', "class E2e < Oxidized::Model\nend\n");
        File::put($branding.'/e2e-brand.txt', 'NetKeep E2E');

        $destination = BackupDestination::query()->create([
            'type' => 's3',
            'name' => 'S3Mock E2E',
            'enabled' => true,
            'config' => [
                'endpoint' => 'http://s3mock:9090',
                'bucket' => 'netkeep-e2e',
                'region' => 'us-east-1',
                'key' => 'integration-key',
                'secret' => 'integration-secret',
                'path_style' => true,
                'encryption_mode' => 'password',
                'password' => self::PASSWORD,
            ],
        ]);

        $archive = app(FullBackupService::class)->create($destination);
        $this->assertSame('completed', $archive->status);
        $this->assertNotNull($archive->path);
        Site::query()->create(['name' => 'E2E transient site']);

        $disk = Storage::build([
            'driver' => 's3',
            'key' => 'integration-key',
            'secret' => 'integration-secret',
            'region' => 'us-east-1',
            'bucket' => 'netkeep-e2e',
            'endpoint' => 'http://s3mock:9090',
            'use_path_style_endpoint' => true,
            'throw' => true,
            'http' => app(SafeHttpClient::class)->options('http://s3mock:9090'),
        ]);
        $this->assertTrue($disk->fileExists($archive->path));
        $this->assertSame(
            [],
            array_values(array_filter(
                $disk->allFiles(),
                fn (string $path): bool => str_contains($path, '.partial-'),
            )),
        );

        File::delete(self::ARCHIVE);
        $source = $disk->readStream($archive->path);
        $target = fopen(self::ARCHIVE.'.partial', 'xb');
        $this->assertIsResource($source);
        $this->assertIsResource($target);
        try {
            stream_copy_to_stream($source, $target);
        } finally {
            fclose($source);
            fclose($target);
        }
        rename(self::ARCHIVE.'.partial', self::ARCHIVE);
        chmod(self::ARCHIVE, 0600);
        File::put(self::PASSWORD_FILE, self::PASSWORD."\n", true);
        chmod(self::PASSWORD_FILE, 0600);

        $this->assertSame($archive->checksum, hash_file('sha256', self::ARCHIVE));
        $this->assertStringNotContainsString(
            'hostname e2e-preserved',
            File::get(self::ARCHIVE),
        );

        $stage = rtrim((string) config('netkeep.restore_inbox'), '/').'/e2e-validation';
        File::deleteDirectory($stage);
        $extractor = new BackupV2Extractor(
            $stage,
            (int) config('netkeep.restore_max_expanded_size'),
            (int) config('netkeep.restore_max_files'),
        );
        app(BackupDecryptor::class)->stream(
            self::ARCHIVE,
            self::PASSWORD,
            null,
            fn (string $chunk) => $extractor->feed($chunk),
        );
        $manifest = app(BackupV2Validator::class)->validate($stage, $extractor->finish());

        $this->assertSame(2, $manifest['format']);
        $this->assertSame($archive->uuid, $manifest['archive_uuid']);
        $this->assertFileExists($stage.'/repository/e2e-configuration');
        $this->assertFileExists($stage.'/model/e2e.rb');
        $this->assertFileExists($stage.'/branding/e2e-brand.txt');
        File::deleteDirectory($stage);
    }
}

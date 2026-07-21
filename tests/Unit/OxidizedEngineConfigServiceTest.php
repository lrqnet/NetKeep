<?php

namespace Tests\Unit;

use App\Services\OxidizedClient;
use App\Services\OxidizedEngineConfigService;
use Illuminate\Support\Facades\File;
use Mockery;
use Tests\TestCase;

class OxidizedEngineConfigServiceTest extends TestCase
{
    protected bool $withCompletedSetup = false;

    private string $path;

    protected function setUp(): void
    {
        parent::setUp();
        $this->path = storage_path('framework/oxidized-engine-test');
        File::deleteDirectory($this->path);
        File::ensureDirectoryExists($this->path);
        config(['netkeep.oxidized.config_path' => $this->path]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->path);
        parent::tearDown();
    }

    public function test_it_replaces_unsafe_scheduler_values_atomically(): void
    {
        File::put($this->path.'/config', <<<'YAML'
---
interval: 3600
threads: 30
use_max_threads: true
retries: 2
next_adds_job: true
input:
  default: ssh
  ssh:
    secure: false
YAML);
        $oxidized = Mockery::mock(OxidizedClient::class);
        $oxidized->shouldReceive('reload')->once()->andReturnTrue();

        (new OxidizedEngineConfigService($oxidized))->configure(7);

        $configuration = File::get($this->path.'/config');
        $this->assertStringContainsString('interval: 0', $configuration);
        $this->assertStringContainsString('threads: 7', $configuration);
        $this->assertStringContainsString('use_max_threads: false', $configuration);
        $this->assertStringContainsString('retries: 0', $configuration);
        $this->assertStringContainsString('next_adds_job: false', $configuration);
        $this->assertStringContainsString('    secure: true', $configuration);
    }

    public function test_it_restores_the_previous_file_when_reload_fails(): void
    {
        $original = <<<'YAML'
---
interval: 0
threads: 5
use_max_threads: false
retries: 0
next_adds_job: false
input:
  default: ssh
  ssh:
    secure: true
YAML;
        File::put($this->path.'/config', $original);
        $oxidized = Mockery::mock(OxidizedClient::class);
        $oxidized->shouldReceive('reload')->twice()->andReturnFalse();

        try {
            (new OxidizedEngineConfigService($oxidized))->configure(10);
            $this->fail('Expected the failed reload to abort the update.');
        } catch (\RuntimeException) {
            $this->assertSame($original, File::get($this->path.'/config'));
        }
    }
}

<?php

namespace Tests\Unit;

use App\Support\RuntimeEnvironment;
use PHPUnit\Framework\TestCase;

class RuntimeEnvironmentTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->directory = sys_get_temp_dir().'/netkeep-runtime-'.bin2hex(random_bytes(8));
        mkdir($this->directory, 0700, true);
    }

    protected function tearDown(): void
    {
        foreach (['NETKEEP_RUNTIME_SECRET', 'NETKEEP_RUNTIME_EXISTING'] as $key) {
            unset($_ENV[$key], $_SERVER[$key]);
            putenv($key);
        }

        $environment = $this->directory.'/app.env';
        if (is_file($environment)) {
            unlink($environment);
        }
        if (is_dir($this->directory)) {
            rmdir($this->directory);
        }

        parent::tearDown();
    }

    public function test_it_loads_a_readable_runtime_environment(): void
    {
        file_put_contents($this->directory.'/app.env', "NETKEEP_RUNTIME_SECRET=loaded\n");

        RuntimeEnvironment::load($this->directory.'/app.env');

        $this->assertSame('loaded', $_ENV['NETKEEP_RUNTIME_SECRET']);
    }

    public function test_it_preserves_an_existing_environment_value(): void
    {
        $_ENV['NETKEEP_RUNTIME_EXISTING'] = 'existing';
        $_SERVER['NETKEEP_RUNTIME_EXISTING'] = 'existing';
        file_put_contents($this->directory.'/app.env', "NETKEEP_RUNTIME_EXISTING=replaced\n");

        RuntimeEnvironment::load($this->directory.'/app.env');

        $this->assertSame('existing', $_ENV['NETKEEP_RUNTIME_EXISTING']);
    }

    public function test_it_ignores_a_missing_runtime_environment(): void
    {
        RuntimeEnvironment::load($this->directory.'/missing.env');

        $this->assertArrayNotHasKey('NETKEEP_RUNTIME_SECRET', $_ENV);
    }
}

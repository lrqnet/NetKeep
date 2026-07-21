<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ContainerRuntimeTest extends TestCase
{
    public function test_worker_keeps_a_long_lived_queue_process_and_observes_maintenance(): void
    {
        $path = is_file('/usr/local/bin/worker.sh')
            ? '/usr/local/bin/worker.sh'
            : dirname(__DIR__, 2).'/docker/worker.sh';
        $script = file_get_contents($path);

        $this->assertIsString($script);
        $this->assertStringContainsString('queue:work --sleep=3 --tries=3 --max-time=300', $script);
        $this->assertStringContainsString('trap stop_worker INT TERM', $script);
        $this->assertStringContainsString('kill -TERM "$worker_pid"', $script);
        $this->assertStringNotContainsString('--stop-when-empty', $script);
    }

    public function test_worker_and_scheduler_wait_for_the_oxidized_healthcheck(): void
    {
        $compose = file_get_contents(dirname(__DIR__, 2).'/compose.yaml');

        $this->assertIsString($compose);
        $this->assertMatchesRegularExpression(
            '/^    worker:\n(?:(?!^    \S).)*?^        depends_on:\n(?:(?!^        \S).)*?^            oxidized:\n^                condition: service_healthy$/ms',
            $compose,
        );
        $this->assertMatchesRegularExpression(
            '/^    scheduler:\n(?:(?!^    \S).)*?^        depends_on:\n(?:(?!^        \S).)*?^            oxidized:\n^                condition: service_healthy$/ms',
            $compose,
        );
    }
}

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

    public function test_scheduler_forwards_shutdown_to_its_active_child(): void
    {
        $path = is_file('/usr/local/bin/scheduler.sh')
            ? '/usr/local/bin/scheduler.sh'
            : dirname(__DIR__, 2).'/docker/scheduler.sh';
        $script = file_get_contents($path);

        $this->assertIsString($script);
        $this->assertStringContainsString('trap stop_scheduler INT TERM', $script);
        $this->assertStringContainsString('kill -TERM "$child_pid"', $script);
        $this->assertStringContainsString('run_child php artisan schedule:run --no-interaction', $script);
        $this->assertStringContainsString('run_child sleep 60', $script);
    }

    public function test_restore_e2e_restarts_services_in_dependency_order(): void
    {
        $script = file_get_contents(dirname(__DIR__, 2).'/scripts/e2e-test.sh');

        $this->assertIsString($script);
        $app = strpos($script, "restart app\n");
        $oxidized = strpos($script, "restart oxidized sandbox\n");
        $workers = strpos($script, "restart worker scheduler\n");
        $finalize = strpos($script, 'netkeep:restore finalize');

        $this->assertIsInt($app);
        $this->assertIsInt($oxidized);
        $this->assertIsInt($workers);
        $this->assertIsInt($finalize);
        $this->assertLessThan($finalize, $app);
        $this->assertLessThan($oxidized, $finalize);
        $this->assertLessThan($workers, $oxidized);
        $this->assertStringContainsString('wait_for_healthy()', $script);
        $this->assertStringNotContainsString('up --detach --wait app worker scheduler oxidized sandbox', $script);
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

    public function test_updater_is_the_only_socket_consumer_and_remains_isolated(): void
    {
        $compose = file_get_contents(dirname(__DIR__, 2).'/compose.yaml');

        $this->assertIsString($compose);
        $this->assertSame(1, substr_count($compose, '/var/run/docker.sock:/var/run/docker.sock'));
        $this->assertMatchesRegularExpression(
            '/^    updater:\n(?:(?!^    \S).)*?^        read_only: true\n(?:(?!^    \S).)*?^        cap_drop:\n^            - ALL\n(?:(?!^    \S).)*?^        security_opt:\n^            - no-new-privileges:true\n(?:(?!^    \S).)*?^        network_mode: none$/ms',
            $compose,
        );
        $this->assertDoesNotMatchRegularExpression(
            '/^    updater:\n(?:(?!^    \S).)*?^        ports:/ms',
            $compose,
        );
    }

    public function test_container_images_define_healthchecks(): void
    {
        $root = dirname(__DIR__, 2);

        foreach (['Dockerfile', 'Dockerfile.oxidized', 'Dockerfile.updater'] as $dockerfile) {
            $contents = file_get_contents($root.'/'.$dockerfile);

            $this->assertIsString($contents);
            $this->assertStringContainsString('HEALTHCHECK', $contents, $dockerfile);
        }
    }

    public function test_updater_root_exception_is_scoped_and_expires(): void
    {
        $root = dirname(__DIR__, 2);
        $ignore = file_get_contents($root.'/.trivyignore.yaml');
        $workflow = file_get_contents($root.'/.github/workflows/security.yml');

        $this->assertIsString($ignore);
        $this->assertIsString($workflow);
        $this->assertSame(1, substr_count($ignore, 'AVD-DS-0002'));
        $this->assertStringContainsString('- Dockerfile.updater', $ignore);
        $this->assertMatchesRegularExpression('/expired_at: 20[0-9]{2}-[0-9]{2}-[0-9]{2}/', $ignore);
        $this->assertStringContainsString('trivyignores: .trivyignore.yaml', $workflow);
        $this->assertStringContainsString("exit-code: '1'", $workflow);
    }

    public function test_security_sensitive_builders_and_fixture_are_current_and_pinned(): void
    {
        $root = dirname(__DIR__, 2);
        $updater = file_get_contents($root.'/Dockerfile.updater');
        $simulator = file_get_contents($root.'/tests/Fixtures/device-simulator/Dockerfile');

        $this->assertIsString($updater);
        $this->assertIsString($simulator);
        $this->assertStringContainsString('golang:1.26.5-alpine@sha256:', $updater);
        $this->assertStringContainsString('docker:29.6.2-cli-alpine3.24@sha256:', $updater);
        $this->assertStringContainsString('RUN rm -f /usr/local/libexec/docker/cli-plugins/docker-buildx', $updater);
        $this->assertStringContainsString('golang:1.26.5-alpine@sha256:', $simulator);
        $this->assertStringContainsString("\nFROM scratch\n", $simulator);
        $this->assertStringContainsString('USER 30001:30001', $simulator);
    }

    public function test_release_uses_the_current_pinned_cosign_installer(): void
    {
        $workflow = file_get_contents(dirname(__DIR__, 2).'/.github/workflows/release.yml');
        $installer = 'sigstore/cosign-installer@6f9f17788090df1f26f669e9d70d6ae9567deba6';

        $this->assertIsString($workflow);
        $this->assertSame(4, substr_count($workflow, $installer));
        $this->assertSame(4, substr_count($workflow, 'cosign-release: v3.0.6'));
        $this->assertStringNotContainsString(
            'sigstore/cosign-installer@f713795cb21599bc4e5c4b58cbad1da852d7eeb9',
            $workflow,
        );
    }
}

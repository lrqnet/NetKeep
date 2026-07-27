import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
    gotoWithTlsRetry,
    reloadWithNetworkRetry,
} from './support/navigation';

const project = process.env.NETKEEP_E2E_PROJECT ?? 'netkeep-e2e';
const root = resolve(import.meta.dirname, '../..');
const composeFiles = [
    '--file',
    'compose.yaml',
    '--file',
    'compose.dev.yaml',
    '--file',
    'compose.e2e.yaml',
];

test('reauthenticates once and preserves update feedback across navigation and restart', async ({
    page,
    request,
}) => {
    test.setTimeout(240_000);
    compose('stop', 'worker');
    appPhp(`
        require "vendor/autoload.php";
        $app = require "bootstrap/app.php";
        $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
        $organization = App\\Models\\Organization::query()->firstOrFail();
        App\\Models\\UpdateReleaseState::query()->updateOrCreate(
            ["organization_id" => $organization->id],
            [
                "status" => "available",
                "available_version" => "1.0.6",
                "compatibility" => "same_major",
                "assets" => [
                    "compose.yaml" => [
                        "url" => "https://github.com/lrqnet/NetKeep/releases/download/v1.0.6/compose.yaml",
                        "size" => 1,
                    ],
                    "update-manifest.json" => [
                        "url" => "https://github.com/lrqnet/NetKeep/releases/download/v1.0.6/update-manifest.json",
                        "size" => 1,
                    ],
                    "update-manifest.sigstore.json" => [
                        "url" => "https://github.com/lrqnet/NetKeep/releases/download/v1.0.6/update-manifest.sigstore.json",
                        "size" => 1,
                    ],
                ],
                "manual_eligible" => true,
                "automatic_eligible" => true,
                "rollback_safe" => true,
                "requires_host_steps" => false,
                "estimated_downtime_seconds" => 300,
                "last_attempt_at" => now(),
                "last_success_at" => now(),
            ],
        );
    `);

    try {
        await gotoWithTlsRetry(page, '/updates');
        await expect(
            page.getByRole('button', { name: 'Update now' }),
        ).toBeEnabled();
        await page.getByRole('button', { name: 'Update now' }).click();
        await page.getByRole('checkbox').check();
        await page
            .getByLabel('Confirm your password')
            .fill('NetKeep-E2E-2026!');

        const accessibility = await new AxeBuilder({ page })
            .include('[role="dialog"]')
            .analyze();
        expect(
            accessibility.violations.filter((violation) =>
                ['critical', 'serious'].includes(violation.impact ?? ''),
            ),
        ).toEqual([]);

        const reauthentication = page.waitForResponse(
            (response) =>
                response.url().endsWith('/updates/reauthenticate') &&
                response.request().method() === 'POST',
        );
        const operation = page.waitForResponse(
            (response) =>
                response.url().endsWith('/updates/run') &&
                response.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Start update' }).click();
        expect([302, 303]).toContain((await reauthentication).status());
        expect([302, 303]).toContain((await operation).status());

        await expect(
            page.getByText('Update request received', { exact: true }),
        ).toBeVisible();
        await reloadWithNetworkRetry(page);
        await expect(
            page.getByText('Update request received', { exact: true }),
        ).toBeVisible();

        await gotoWithTlsRetry(page, '/dashboard');
        await expect(
            page.getByText('Updating v1.0.3 to v1.0.6', { exact: true }),
        ).toBeVisible();

        compose('restart', 'app');
        await expect
            .poll(
                async () => {
                    try {
                        return (await request.get('/up')).status();
                    } catch {
                        return 0;
                    }
                },
                { timeout: 120_000 },
            )
            .toBe(200);
        await reloadWithNetworkRetry(page);
        await expect(
            page.getByText('Updating v1.0.3 to v1.0.6', { exact: true }),
        ).toBeVisible();

        appPhp(`
            require "vendor/autoload.php";
            $app = require "bootstrap/app.php";
            $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
            App\\Models\\UpdateOperation::query()->latest("requested_at")->firstOrFail()->update([
                "status" => "succeeded",
                "completed_at" => now(),
                "last_progress_at" => now(),
            ]);
        `);
        await reloadWithNetworkRetry(page);
        await expect(
            page.getByText('NetKeep v1.0.6 was installed successfully.', {
                exact: true,
            }),
        ).toBeVisible();
        await reloadWithNetworkRetry(page);
        await expect(
            page.getByText('NetKeep v1.0.6 was installed successfully.', {
                exact: true,
            }),
        ).toBeVisible();

        await page.getByRole('link', { name: 'View progress' }).click();
        await expect(
            page.getByText('Update completed', { exact: true }),
        ).toBeVisible();
        const acknowledgement = page.waitForResponse(
            (response) =>
                response.url().includes('/updates/operations/') &&
                response.url().endsWith('/acknowledge') &&
                response.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Dismiss status' }).click();
        expect([302, 303]).toContain((await acknowledgement).status());
        await expect(
            page.getByText('Update completed', { exact: true }),
        ).not.toBeVisible();
    } finally {
        appPhp(`
            require "vendor/autoload.php";
            $app = require "bootstrap/app.php";
            $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
            Illuminate\\Support\\Facades\\DB::table("jobs")
                ->where("payload", "like", "%PrepareUpdateOperation%")
                ->delete();
            App\\Models\\UpdateOperation::query()
                ->whereNull("acknowledged_at")
                ->update(["acknowledged_at" => now()]);
        `);
        compose('start', 'worker');
    }
});

function compose(...args: string[]): void {
    execFileSync(
        'docker',
        ['compose', '--project-name', project, ...composeFiles, ...args],
        {
            cwd: root,
            stdio: 'pipe',
        },
    );
}

function appPhp(code: string): void {
    compose('exec', '--no-TTY', 'app', 'php', '-r', code);
}

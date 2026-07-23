import { expect, test } from '@playwright/test';
import { gotoWithTlsRetry } from './support/navigation';

test('runs an isolated diagnostic and exposes only the protected trace', async ({
    page,
}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium');
    test.setTimeout(120_000);

    await gotoWithTlsRetry(page, '/devices');
    const deviceRow = page.getByRole('row').filter({ hasText: 'E2E Router' });
    const editHref = await deviceRow
        .locator('a[href$="/edit"]')
        .getAttribute('href');

    expect(editHref).toMatch(/^\/devices\/\d+\/edit$/);
    const deviceId = editHref?.match(/^\/devices\/(\d+)\/edit$/)?.[1];

    expect(deviceId).toBeTruthy();
    await gotoWithTlsRetry(page, editHref as string);
    await page.getByRole('tab', { name: 'Collections' }).click();
    await expect(page.getByText('Collection history')).toBeVisible();
    await page.getByLabel('Type DIAGNOSTIC to confirm').fill('DIAGNOSTIC');

    const diagnosticResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith(`/devices/${deviceId}/diagnostics`) &&
            response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Start diagnostic' }).click();
    expect([302, 303]).toContain((await diagnosticResponse).status());

    await expect
        .poll(
            async () => {
                const response = await page.request.get(
                    `/devices/${deviceId}/collection-runs?origin=diagnostic`,
                );
                expect(response.ok()).toBeTruthy();
                const payload = (await response.json()) as {
                    data: Array<{
                        status: string;
                        artifact: { available: boolean } | null;
                    }>;
                };
                const run = payload.data[0];

                return `${run?.status ?? 'missing'}:${run?.artifact?.available ?? false}`;
            },
            { timeout: 90_000 },
        )
        .toBe('succeeded:true');

    await page.reload();
    await page.getByRole('tab', { name: 'Collections' }).click();
    const diagnosticRun = page
        .getByRole('button')
        .filter({ hasText: 'Diagnostic' })
        .filter({ hasText: 'Succeeded' })
        .first();
    await expect(diagnosticRun).toContainText('Succeeded');
    await diagnosticRun.click();
    await expect(page.getByText('Protected raw trace')).toBeVisible();

    const traceResponse = page.waitForResponse(
        (response) =>
            /\/collection-runs\/[0-9a-f-]+\/trace$/.test(response.url()) &&
            response.request().method() === 'GET',
    );
    await page.getByRole('link', { name: 'View trace' }).click();
    const trace = await traceResponse;

    expect(trace.ok()).toBeTruthy();
    expect(trace.headers()['cache-control']).toContain('no-store');
    await expect(page.locator('pre')).toContainText('NETKEEP-E2E');

    await gotoWithTlsRetry(page, '/devices');
    const collectionRow = page
        .getByRole('row')
        .filter({ hasText: 'E2E Router' });
    await collectionRow.getByRole('button', { name: 'Collect now' }).click();
    await page.getByRole('button', { name: 'Queue collection' }).click();
});

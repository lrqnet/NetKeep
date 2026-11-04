import { expect, test } from '@playwright/test';
import { gotoWithTlsRetry } from './support/navigation';

for (const scenario of ['changes', 'empty', 'failure'] as const) {
    test(`configuration comparison handles ${scenario}`, async ({ page }) => {
        await gotoWithTlsRetry(page, '/devices');
        const link = page
            .getByRole('row')
            .filter({ hasText: 'E2E Router' })
            .locator('a[href$="/configuration"]');
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        const older = 'a'.repeat(40);
        const newer = 'b'.repeat(40);

        await page.route(`**${href}`, async (route) => {
            const response = await route.fetch();
            const payload = await response.json();
            payload.props.versions = [newer, older].map((hash) => ({
                hash,
                date: '2026-11-04T12:00:00Z',
                author: 'Fixture',
                subject: 'Fixture revision',
            }));
            payload.props.historyUnavailable = false;
            payload.props.content = 'fixture configuration';
            await route.fulfill({ response, json: payload });
        });
        await page.route(`**${href}/diff?*`, async (route) => {
            const url = new URL(route.request().url());
            expect(url.searchParams.get('from')).toBe(older);
            expect(url.searchParams.get('to')).toBe(newer);
            await route.fulfill({
                status: scenario === 'failure' ? 503 : 200,
                contentType: 'text/plain',
                body:
                    scenario === 'changes'
                        ? '-old configuration\n+new configuration'
                        : '',
            });
        });
        await link.click();
        await page
            .getByRole('button', { name: 'Compare', exact: true })
            .click();
        await expect(page.getByLabel('From revision')).toHaveValue(older);
        await expect(page.getByLabel('To revision')).toHaveValue(newer);
        await page
            .getByRole('button', { name: 'Compare', exact: true })
            .last()
            .click();

        if (scenario === 'failure') {
            await expect(page.getByRole('alert')).toContainText(
                'Could not load the comparison',
            );
        } else {
            await expect(page.locator('pre').first()).toContainText(
                scenario === 'empty'
                    ? 'No changes between these revisions.'
                    : '+new configuration',
            );
        }
    });
}

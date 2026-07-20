import { expect, test } from '@playwright/test';

test('registers and signs in with a passkey', async ({
    browserName,
    context,
    page,
}, testInfo) => {
    test.skip(
        browserName !== 'chromium' || testInfo.project.name !== 'chromium',
    );

    await context.credentials.install();
    await page.goto('/settings/security');
    await page.getByRole('button', { name: 'Add passkey' }).click();
    await page.getByLabel('Passkey name').fill('NetKeep E2E passkey');
    await page.getByRole('button', { name: 'Register passkey' }).click();
    await expect(page.getByText('NetKeep E2E passkey')).toBeVisible();

    const credentials = await context.credentials.get({
        rpId: new URL(process.env.NETKEEP_E2E_BASE_URL as string).hostname,
    });
    expect(credentials).toHaveLength(1);

    const menu = page.locator('[data-test="sidebar-menu-button"]');
    await expect(menu).toBeVisible();
    await context.clearCookies();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
});

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openUserMenu(page: Page) {
    const menu = page.locator('[data-test="sidebar-menu-button"]');

    if (!(await menu.isVisible())) {
        await page.locator('[data-sidebar="trigger"]').click();
    }

    await menu.click();
}

async function changeLanguage(
    page: Page,
    currentLanguage: string,
    nextLanguage: string,
) {
    await openUserMenu(page);
    await page.getByRole('menuitem', { name: currentLanguage }).click();
    const response = page.waitForResponse(
        (item) =>
            item.url().endsWith('/locale') &&
            item.request().method() === 'PUT',
    );
    await page.getByRole('menuitem', { name: nextLanguage }).click();
    expect([302, 303]).toContain((await response).status());
}

test('persists English, Portuguese and Spanish preferences', async ({
    page,
}) => {
    await page.goto('/dashboard');

    await changeLanguage(page, 'English', 'Português');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await changeLanguage(page, 'Português', 'Español');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await changeLanguage(page, 'Español', 'English');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('persists light and dark themes', async ({ page }) => {
    await page.goto('/settings/appearance');

    await page.locator('[data-appearance="dark"]').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.locator('[data-appearance="light"]').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
});

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { gotoWithTlsRetry } from './support/navigation';

const authFile = 'playwright/.auth/owner.json';

setup.setTimeout(120_000);

setup('installs NetKeep and creates the first owner', async ({ page }) => {
    const token = process.env.NETKEEP_INSTALLATION_TOKEN;
    const baseURL = process.env.NETKEEP_E2E_BASE_URL;
    const bootstrapURL = process.env.NETKEEP_E2E_BOOTSTRAP_URL;

    expect(token).toBeTruthy();
    expect(baseURL).toBeTruthy();
    expect(bootstrapURL).toBeTruthy();

    await gotoWithTlsRetry(page, bootstrapURL as string);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: 'Change language' }).click();
    const portugueseResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith('/locale') &&
            response.request().method() === 'PUT',
    );
    await page.getByRole('menuitem', { name: 'Português' }).click();
    await portugueseResponse;
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.getByRole('button', { name: 'Alterar idioma' }).click();
    const englishResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith('/locale') &&
            response.request().method() === 'PUT',
    );
    await page.getByRole('menuitem', { name: 'English' }).click();
    await englishResponse;
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await gotoWithTlsRetry(page, `${bootstrapURL}/register`);
    await page.getByLabel('Server installation token').fill(token as string);
    await page.getByLabel('Name').fill('NetKeep E2E Owner');
    await page.getByLabel('Email address').fill('owner@netkeep.example');
    await page
        .getByLabel('Password', { exact: true })
        .fill('NetKeep-E2E-2026!');
    await page.getByLabel('Confirm password').fill('NetKeep-E2E-2026!');
    const registrationResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith('/register') &&
            response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create owner' }).click();
    const registration = await registrationResponse;

    expect([302, 303]).toContain(registration.status());
    await expect(page).toHaveURL(/\/setup$/, { timeout: 30_000 });
    await page.getByLabel('Company or operation').fill('NetKeep E2E');
    await page.getByLabel('Time zone').selectOption('UTC');
    await page.getByLabel('Canonical HTTPS URL').fill(baseURL as string);
    await page.getByLabel('Default collection interval (seconds)').fill('3600');
    await page.getByLabel('Default timeout (seconds)').fill('20');
    await page.getByLabel('Full backup retention (days)').fill('30');
    await page
        .getByRole('button', { name: 'Finish and open dashboard' })
        .click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.locator('main')).toBeVisible();

    await gotoWithTlsRetry(page, '/user/confirm-password');
    await page
        .getByLabel('Password', { exact: true })
        .fill('NetKeep-E2E-2026!');
    const confirmationResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith('/user/confirm-password') &&
            response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm password' }).click();
    expect([302, 303]).toContain((await confirmationResponse).status());

    await gotoWithTlsRetry(page, '/credentials');
    await page.getByLabel('Profile name').fill('E2E SSH');
    await page.getByLabel('Username').fill('netkeep');
    await page.getByLabel('Password', { exact: true }).fill('e2e');
    await page.getByRole('button', { name: 'Save encrypted' }).click();
    await expect(page.getByText('E2E SSH', { exact: true })).toBeVisible();

    await gotoWithTlsRetry(page, '/devices');
    await page.getByLabel('Name', { exact: true }).fill('E2E Router');
    await page
        .getByLabel('IP address')
        .fill(process.env.NETKEEP_E2E_DEVICE_IP ?? '10.254.250.10');
    await page
        .getByRole('spinbutton', { name: 'Port', exact: true })
        .fill('2222');
    await page.getByLabel('Oxidized driver').fill('ios');
    await page.getByLabel('Credential').selectOption({ label: 'E2E SSH' });
    await page.getByRole('button', { name: 'Add device' }).click();

    let deviceRow = page.getByRole('row').filter({ hasText: 'E2E Router' });
    await expect(deviceRow).toBeVisible();
    const editHref = await deviceRow
        .locator('a[href$="/edit"]')
        .getAttribute('href');
    expect(editHref).toMatch(/^\/devices\/\d+\/edit$/);
    await gotoWithTlsRetry(page, editHref as string);
    await page.getByLabel('Hostname').fill('device-simulator');
    const updateResponse = page.waitForResponse(
        (response) =>
            response.url().endsWith(editHref?.replace(/\/edit$/, '') ?? '') &&
            response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect([302, 303]).toContain((await updateResponse).status());

    await gotoWithTlsRetry(page, '/devices');
    deviceRow = page.getByRole('row').filter({ hasText: 'E2E Router' });
    await expect(deviceRow).toBeVisible();
    const approvalResponse = page.waitForResponse(
        (response) =>
            /\/devices\/\d+\/approve$/.test(response.url()) &&
            response.request().method() === 'POST',
    );
    await deviceRow
        .getByRole('button', { name: 'Review and approve device' })
        .click();
    expect([302, 303]).toContain((await approvalResponse).status());
    await expect(
        deviceRow.getByText('Approved', { exact: true }),
    ).toBeVisible();

    mkdirSync(dirname(authFile), { recursive: true });
    await page.context().storageState({ path: authFile });

    const guestContext = await page.context().browser()!.newContext({
        ignoreHTTPSErrors: true,
    });
    const closedRegistration = await guestContext.request.get(
        `${baseURL}/register`,
        { maxRedirects: 0 },
    );
    expect(closedRegistration.status()).toBe(404);
    await guestContext.close();
});

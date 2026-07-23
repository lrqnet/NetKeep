import type { Page, Response } from '@playwright/test';

export async function gotoWithTlsRetry(
    page: Page,
    url: string,
): Promise<Response | null> {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            return await page.goto(url);
        } catch (error) {
            if (
                attempt === 4 ||
                !String(error).includes('ERR_SSL_PROTOCOL_ERROR')
            ) {
                throw error;
            }

            await page.waitForTimeout(attempt * 1_000);
        }
    }

    return null;
}

import type { Page, Response } from '@playwright/test';

function isRetryableNetworkError(error: unknown): boolean {
    return /ERR_SSL_PROTOCOL_ERROR|ERR_NETWORK_CHANGED/.test(String(error));
}

export async function gotoWithTlsRetry(
    page: Page,
    url: string,
): Promise<Response | null> {
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
            return await page.goto(url);
        } catch (error) {
            if (
                attempt === 8 ||
                !isRetryableNetworkError(error)
            ) {
                throw error;
            }

            await page.waitForTimeout(attempt * 1_000);
        }
    }

    return null;
}

export async function reloadWithNetworkRetry(page: Page): Promise<Response | null> {
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
            return await page.reload();
        } catch (error) {
            if (attempt === 8 || !isRetryableNetworkError(error)) {
                throw error;
            }

            await page.waitForTimeout(attempt * 1_000);
        }
    }

    return null;
}

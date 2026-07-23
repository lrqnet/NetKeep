import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoWithTlsRetry } from './support/navigation';

const routes = [
    '/dashboard',
    '/devices',
    '/credentials',
    '/catalog',
    '/models',
    '/integrations',
    '/notifications',
    '/data-protection',
    '/users',
    '/audit',
    '/system',
    '/updates',
    '/settings/profile',
    '/settings/security',
    '/settings/appearance',
];

for (const route of routes) {
    test(`${route} renders without serious accessibility violations`, async ({
        page,
    }) => {
        const response = await gotoWithTlsRetry(page, route);

        expect(response?.ok()).toBeTruthy();
        await expect(page.locator('main')).toBeVisible();
        const untranslatedText = await page.locator('body').evaluate((body) => {
            const walker = document.createTreeWalker(
                body,
                NodeFilter.SHOW_TEXT,
            );
            const fragments: string[] = [];

            while (walker.nextNode()) {
                const parent = walker.currentNode.parentElement;

                if (
                    parent?.closest(
                        'script, style, noscript, pre, code, [data-technical-code]',
                    )
                ) {
                    continue;
                }

                fragments.push(walker.currentNode.textContent ?? '');
            }

            return fragments.join(' ');
        });
        expect(untranslatedText).not.toMatch(
            /(?:nav|common|settings|auth|system)\.[a-z_]+/,
        );

        const violations = (
            await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze()
        ).violations.filter(
            ({ impact }) => impact === 'critical' || impact === 'serious',
        );

        expect(violations).toEqual([]);

        const dimensions = await page.evaluate(() => ({
            document: document.documentElement.scrollWidth,
            viewport: document.documentElement.clientWidth,
        }));
        expect(dimensions.document).toBeLessThanOrEqual(
            dimensions.viewport + 1,
        );
    });
}

for (const route of [
    '/dashboard',
    '/devices',
    '/notifications',
    '/data-protection',
    '/system',
]) {
    test(`${route} produces a review screenshot`, async ({
        page,
    }, testInfo) => {
        await gotoWithTlsRetry(page, route);
        await expect(page.locator('main')).toBeVisible();
        await testInfo.attach(
            `${testInfo.project.name}-${route.slice(1).replaceAll('/', '-')}`,
            {
                body: await page.screenshot({ fullPage: true }),
                contentType: 'image/png',
            },
        );
    });
}

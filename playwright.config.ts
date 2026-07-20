import { defineConfig, devices } from '@playwright/test';

const baseURL =
    process.env.NETKEEP_E2E_BASE_URL ?? 'https://127.0.0.1:18444';
const authFile = 'playwright/.auth/owner.json';
const authenticated = {
    baseURL,
    ignoreHTTPSErrors: true,
    storageState: authFile,
    trace: 'on-first-retry' as const,
    screenshot: 'only-on-failure' as const,
    video: 'retain-on-failure' as const,
};

export default defineConfig({
    testDir: './tests/E2E',
    outputDir: 'test-results',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    timeout: 45_000,
    expect: {
        timeout: 10_000,
    },
    reporter: process.env.CI
        ? [
              ['line'],
              ['html', { open: 'never', outputFolder: 'playwright-report' }],
          ]
        : [
              ['list'],
              ['html', { open: 'never', outputFolder: 'playwright-report' }],
          ],
    projects: [
        {
            name: 'setup',
            testMatch: /installation\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                baseURL,
                ignoreHTTPSErrors: true,
            },
        },
        {
            name: 'chromium',
            testIgnore: /installation\.setup\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Chrome'],
                ...authenticated,
            },
        },
        {
            name: 'firefox',
            testIgnore: /installation\.setup\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Firefox'],
                ...authenticated,
            },
        },
        {
            name: 'webkit',
            testIgnore: /installation\.setup\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Safari'],
                ...authenticated,
            },
        },
        {
            name: 'mobile-chrome',
            testIgnore: /installation\.setup\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['Pixel 7'],
                ...authenticated,
            },
        },
        {
            name: 'mobile-safari',
            testIgnore: /installation\.setup\.ts/,
            dependencies: ['setup'],
            use: {
                ...devices['iPhone 15'],
                ...authenticated,
            },
        },
    ],
});

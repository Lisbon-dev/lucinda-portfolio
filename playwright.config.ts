import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for navigation/transition regression tests.
 * Boots the Astro dev server and runs against Chromium + WebKit.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for landing-page regression tests.
 * Runs the Astro dev server and exercises the homepage in Chromium + WebKit.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // Generous per-test timeout: the dev server optimizes large portfolio images
  // on demand, so a cold first navigation can be slow.
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});

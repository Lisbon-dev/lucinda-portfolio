import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the portfolio.
 * Runs `pnpm dev` and exercises the About/Contact modals after a view
 * transition, in both Chromium and WebKit (Safari engine — see issue #74).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Dev-mode astro:assets optimizes each image on first request, so a cold
  // homepage load can be slow; give tests headroom beyond the 30s default.
  timeout: 60_000,
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

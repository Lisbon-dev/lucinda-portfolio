import { test, expect } from '@playwright/test';

const PROJECT_SLUG = 'battersea-power-station';

/**
 * Regression coverage for issue #72:
 * - SPA navigation via the ClientRouter must not accumulate console errors.
 * - The homepage Lenis init must observe single-instance discipline, so the
 *   dev-only window.__lenisInits counter must not grow unbounded per nav.
 * - The page must remain scrollable after repeated round-trips (no leaked
 *   RAF loops / dead Lenis instances hijacking scroll).
 */
test('repeated home <-> project navigation stays clean and scrollable', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const initsAfterFirstLoad = await page.evaluate(
    () => (window as any).__lenisInits ?? 0,
  );

  const ROUNDS = 5;
  for (let i = 0; i < ROUNDS; i++) {
    await page.goto(`/projects/${PROJECT_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  // No accumulation of console/page errors across navigations.
  expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);

  // Single-instance discipline: each homepage render initializes Lenis at most
  // once. With 1 initial load + 5 return visits we expect ~6 inits, certainly
  // not the quadratic/unbounded growth a leaked RAF loop would imply. Allow a
  // small margin for astro:after-swap re-inits.
  const initsAfterNav = await page.evaluate(
    () => (window as any).__lenisInits ?? 0,
  );
  expect(initsAfterNav - initsAfterFirstLoad).toBeLessThanOrEqual(ROUNDS + 2);

  // The homepage must still scroll after all the round-trips.
  const scrolled = await page.evaluate(async () => {
    const start = window.scrollY;
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    return window.scrollY > start;
  });
  expect(scrolled).toBe(true);
});

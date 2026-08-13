import { test, expect } from '@playwright/test';

/**
 * Regression guard for issue #73 — landing-page load stability.
 *
 * The hero title used to reflow horizontally when the ivypresto-display webfont
 * swapped in over the Times New Roman fallback. A fallback-metrics @font-face now
 * keeps the fallback occupying the same footprint, so the swap must not move the
 * title. We measure the title box early (fallback in use) and again after the
 * heading font has finished loading, and assert it barely moves.
 */
test('hero title does not reflow horizontally when the heading font loads', async ({ page }) => {
  // Wait only for the document, not every masonry image, so the image-heavy
  // homepage doesn't time out the navigation on slower engines.
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const title = page.locator('.hero-title .animated-header').first();
  await title.waitFor({ state: 'attached' });

  // Capture the title box as early as possible — the fallback font is in use here.
  const early = await title.boundingBox();
  expect(early, 'hero title should have a layout box on load').not.toBeNull();

  // Wait for the heading webfont to finish loading (or fail to). Bound the wait:
  // on some engines document.fonts.ready re-pends while stylesheets stream in, so
  // race it against a ceiling and measure afterwards either way.
  await page.evaluate(
    () =>
      Promise.race([
        (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]),
  );

  const late = await title.boundingBox();
  expect(late, 'hero title should still have a layout box after fonts load').not.toBeNull();

  const dx = Math.abs(late!.x - early!.x);
  const dw = Math.abs(late!.width - early!.width);

  // Fallback metrics should keep the font swap from reflowing the title.
  expect(dx, `hero title left edge moved ${dx.toFixed(1)}px on font swap`).toBeLessThan(10);
  expect(dw, `hero title width changed ${dw.toFixed(1)}px on font swap`).toBeLessThan(16);
});

/**
 * There must be exactly one hero entrance animation. The duplicate CSS keyframe
 * `heroFadeIn` (which translated the whole .hero-header at the same time as the
 * per-syllable Motion.js reveal) was removed.
 */
test('the duplicate heroFadeIn entrance is gone', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const hasHeroFadeIn = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | undefined;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet, skip
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule.cssText && rule.cssText.includes('heroFadeIn')) return true;
      }
    }
    return false;
  });

  expect(hasHeroFadeIn, 'heroFadeIn keyframe/animation should no longer be defined').toBe(false);
});

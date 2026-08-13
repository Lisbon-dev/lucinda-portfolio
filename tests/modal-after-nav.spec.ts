import { test, expect, type Page } from '@playwright/test';

/**
 * Regression for issue #74 (Safari): the dialog/form scripts were bound only
 * on DOMContentLoaded, so on the DOM swapped in by an Astro View Transition
 * they were dead — the About/Contact modals opened (the Header uses inline
 * onclick) but their scroll, inner buttons and multi-step form did nothing.
 *
 * Each test performs a real client-side navigation (a project link click, which
 * the ClientRouter intercepts as a view transition) and then a history back
 * (also a transition), landing on the swapped-in homepage before exercising the
 * modals. Without the astro:after-swap / astro:page-load re-init, these fail.
 */

// A single logical navigation can emit several transition events in a burst
// (Astro re-runs the ClientRouter for scroll restoration, so back navigation
// fires before-preparation -> after-swap -> page-load more than once). Layout's
// astro:before-preparation handler closes any open dialog, so opening one while
// a navigation is still pending would immediately close it. We therefore wait
// until no transition event has fired for 700ms before touching the modals.
async function waitForTransitionsToSettle(page: Page) {
  await page.waitForFunction(
    () => Date.now() - ((window as any).__lastNav ?? 0) > 700,
    undefined,
    { timeout: 15_000 },
  );
}

async function navigateAwayAndBack(page: Page) {
  // domcontentloaded (not "load"): in dev, astro:assets optimizes each image on
  // first request, so the image-heavy homepage never fires "load" quickly.
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Track the last transition event. View transitions reuse the same document,
  // so this instrumentation survives every subsequent swap.
  await page.evaluate(() => {
    (window as any).__lastNav = Date.now();
    const bump = () => ((window as any).__lastNav = Date.now());
    document.addEventListener('astro:before-preparation', bump);
    document.addEventListener('astro:after-swap', bump);
    document.addEventListener('astro:page-load', bump);
  });

  const projectLink = page.locator('a.project-link').first();
  await projectLink.waitFor({ state: 'visible' });

  // Forward: view transition into a project page.
  await projectLink.click();
  await page.waitForURL('**/projects/**');

  // Back: ClientRouter handles popstate as a view transition too, swapping the
  // homepage DOM (with its modals) back in.
  await page.goBack();
  await page.waitForURL((url) => url.pathname === '/');
  await waitForTransitionsToSettle(page);
  await page.locator('#about-dialog').waitFor({ state: 'attached' });
}

test.describe('modals remain functional after navigation (#74)', () => {
  test('About dialog content-area scrolls via wheel after nav', async ({ page }) => {
    // A short viewport guarantees the long About bio overflows and is scrollable.
    await page.setViewportSize({ width: 1024, height: 600 });
    await navigateAwayAndBack(page);

    await page.evaluate(() => {
      (document.getElementById('about-dialog') as HTMLDialogElement).showModal();
    });

    const contentArea = page.locator('#about-dialog .content-area');
    await expect(contentArea).toBeVisible();

    const box = await contentArea.boundingBox();
    expect(box).not.toBeNull();

    const scrollable = await contentArea.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(scrollable, 'about content-area should overflow to be scrollable').toBe(true);

    const before = await contentArea.evaluate((el) => el.scrollTop);

    // Real (trusted) wheel over the content area. The component's wheel handler
    // preventDefaults the event and drives .content-area.scrollTop itself; on
    // WebKit a modal <dialog> only scrolls through this handler. If the handler
    // wasn't re-bound after navigation, scrollTop never moves — the #74 bug.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 600);

    await expect
      .poll(async () => contentArea.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(before);
  });

  test('Contact trigger inside About opens the contact dialog after nav', async ({ page }) => {
    await navigateAwayAndBack(page);

    await page.evaluate(() => {
      (document.getElementById('about-dialog') as HTMLDialogElement).showModal();
    });

    await page.locator('#about-dialog [data-dialog-trigger="contact-dialog"]').click();

    await expect(page.locator('#contact-dialog[open]')).toBeAttached();
  });

  test('multi-step contact form submits successfully after nav', async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await navigateAwayAndBack(page);

    await page.evaluate(() => {
      (document.getElementById('contact-dialog') as HTMLDialogElement).showModal();
    });

    const form = page.locator('#contact-dialog [data-contact-form]');
    await expect(form).toBeVisible();

    // Step 1: name + email
    await form.locator('[name="name"]').fill('Ada Lovelace');
    await form.locator('[name="email"]').fill('ada@example.com');
    await form.locator('[data-next-button]').click();

    // Step 2: subject + message
    await form.locator('[name="subject"]').selectOption({ index: 1 });
    await form
      .locator('[name="message"]')
      .fill('This is a sufficiently long test message.');
    await form.locator('[data-next-button]').click();

    // Step 3: privacy consent + submit
    await form.locator('[name="privacy_consent"]').check();
    await form.locator('[data-submit-button]').click();

    await expect(page.locator('#contact-dialog [data-success-message]')).toBeVisible();
  });
});

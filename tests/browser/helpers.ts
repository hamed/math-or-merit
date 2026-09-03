import { expect, type Locator, type Page } from '@playwright/test';

/** Approach a deferred boundary, then wait for the component that replaces it. */
export async function loadDeferred(page: Page, label: string, target: Locator): Promise<void> {
  const marker = page.locator(`[data-deferred="${label}"]`);
  await expect(target.or(marker).first()).toBeAttached();
  if ((await target.count()) === 0) {
    await page.evaluate((deferredLabel) => {
      const deferred = [...document.querySelectorAll<HTMLElement>('[data-deferred]')]
        .find((element) => element.dataset.deferred === deferredLabel);
      deferred?.scrollIntoView({ block: 'center' });
    }, label);
  }
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

/**
 * Wait for the reading-place restore to let go of the page.
 *
 * The walk may legally run for its whole budget, so a fixed delay is a race.
 * It is finished when every deferred block has mounted — nothing left that can
 * move the anchor — and the scroll position has stopped changing.
 */
export async function restoreSettled(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const first = await page.evaluate(() => ({
          y: Math.round(scrollY),
          pending: document.querySelectorAll('[data-deferred]').length,
        }));
        await page.waitForTimeout(250);
        const second = await page.evaluate(() => Math.round(scrollY));
        return first.pending === 0 && first.y === second;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

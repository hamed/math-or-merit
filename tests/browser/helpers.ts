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
 * The walk may legally run for its whole budget, and its own release condition
 * is longer than any interval worth sampling from out here, so this waits for
 * the state the restore publishes rather than inferring one.
 */
export async function restoreSettled(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-reading-place', 'settled', { timeout: 15_000 });
}

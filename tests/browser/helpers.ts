import { expect, type Locator, type Page } from '@playwright/test';

/** Approach a deferred boundary, then wait for the component that replaces it. */
export async function loadDeferred(page: Page, label: string, target: Locator): Promise<void> {
  const marker = page.locator(`[data-deferred="${label}"]`);
  await expect(target.or(marker).first()).toBeAttached();
  if ((await target.count()) === 0) await marker.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(target).toBeVisible({ timeout: 10_000 });
  await target.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

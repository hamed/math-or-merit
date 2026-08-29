import { expect, test } from '@playwright/test';

test('@visual opening at 390 × 844', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const opening = page.locator('.pin-scene').first();
  await expect(opening).toHaveClass(/reduced/);
  await page.waitForTimeout(250);
  await expect(opening).toHaveScreenshot('opening-390x844.png', {
    animations: 'disabled',
  });
});

test('@visual sandbox at 844 × 390', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await sandbox.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY));
  await expect(sandbox).toHaveScreenshot('sandbox-844x390.png', { animations: 'disabled' });
});

test('@visual sandbox at 1440 × 900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await sandbox.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY));
  await expect(sandbox).toHaveScreenshot('sandbox-1440x900.png', { animations: 'disabled' });
});

import { expect, test, type Locator } from '@playwright/test';
import { loadDeferred } from './helpers';

const sandboxScreenshotOptions = {
  animations: 'disabled' as const,
};

async function hideRandomRoom(sandbox: Locator) {
  // The room is deliberately unseeded. Keep visual regression coverage on its
  // dimensions and surrounding UI without snapshotting a different draw each run.
  await sandbox
    .locator('.room canvas')
    .evaluate((canvas) => canvas.setAttribute('style', 'visibility: hidden !important'));
}

async function expectSandboxScreenshot(sandbox: Locator, name: string) {
  const screenshot = await sandbox.screenshot(sandboxScreenshotOptions);
  expect(screenshot).toMatchSnapshot(name);
}

async function alignSandboxCapture(sandbox: Locator) {
  await sandbox.evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY);
    const fractionalTop = el.getBoundingClientRect().top;
    el.style.transform = `translateY(${-fractionalTop}px)`;
  });
}

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
  await loadDeferred(page, 'sandbox', sandbox);
  await alignSandboxCapture(sandbox);
  await hideRandomRoom(sandbox);
  await expectSandboxScreenshot(sandbox, 'sandbox-844x390.png');
});

test('@visual sandbox at 1440 × 900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
  await alignSandboxCapture(sandbox);
  await hideRandomRoom(sandbox);
  await expectSandboxScreenshot(sandbox, 'sandbox-1440x900.png');
});

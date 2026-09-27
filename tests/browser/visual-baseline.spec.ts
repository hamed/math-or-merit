import { expect, test, type Locator } from '@playwright/test';

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

test('@visual title at 390 × 844', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // the whole title: the stage restored at the step where MATH has landed
  const index = await page.evaluate(async () => {
    const script = await import('/src/lib/widgets/stage/scenes/pair/script.ts');
    return script.PAIR_STEPS.findIndex((s: { id: string }) => s.id === 'title.math');
  });
  await page.evaluate((i) => sessionStorage.setItem('merit-or-math:stage:pair:v1', JSON.stringify({ index: i, released: [] })), index);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const stage = page.locator('.step-stage');
  await expect(stage).toHaveAttribute('data-step', String(index));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await expect(stage).toHaveScreenshot('title-390x844.png', { animations: 'disabled' });
});

test('@visual sandbox at 844 × 390', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
  await alignSandboxCapture(sandbox);
  await hideRandomRoom(sandbox);
  await expectSandboxScreenshot(sandbox, 'sandbox-844x390.png');
});

test('@visual sandbox at 1440 × 900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
  await alignSandboxCapture(sandbox);
  await hideRandomRoom(sandbox);
  await expectSandboxScreenshot(sandbox, 'sandbox-1440x900.png');
});

import { expect, test } from '@playwright/test';

test('the opening owns the phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const opening = page.locator('.pin-scene').first();
  const box = await opening.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBe(0);
  expect(box!.height).toBeGreaterThanOrEqual(843);
  const headline = await page.locator('.opening .teletype').boundingBox();
  expect(headline).not.toBeNull();
  expect(headline!.x + headline!.width).toBeLessThanOrEqual(390);
});

test('illustrated plates load one stage ahead instead of all at startup', async ({ page }) => {
  const images: string[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.webp')) images.push(response.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  expect(images.some((url) => url.includes('/cast/'))).toBe(true);
  expect(images.some((url) => url.includes('/person/'))).toBe(false);

  await page.locator('.pin-scene').nth(2).scrollIntoViewIfNeeded();
  await expect.poll(() => images.some((url) => url.includes('/person/'))).toBe(true);
});

test('the sandbox stacks into a readable page on a short landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await sandbox.scrollIntoViewIfNeeded();
  const layout = await sandbox.evaluate((el) => {
    const style = getComputedStyle(el);
    const room = el.querySelector<HTMLElement>('.room-flex')!;
    return {
      columns: style.gridTemplateColumns.split(' ').length,
      height: el.getBoundingClientRect().height,
      roomHeight: room.getBoundingClientRect().height,
    };
  });
  expect(layout.columns).toBe(2);
  expect(layout.height).toBeGreaterThan(390);
  expect(layout.roomHeight).toBeGreaterThanOrEqual(250);

  const undersized = await sandbox.locator('button:visible').evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const box = button.getBoundingClientRect();
        return { label: button.getAttribute('aria-label') ?? button.textContent?.trim(), width: box.width, height: box.height };
      })
      .filter(({ width, height }) => width < 44 || height < 44),
  );
  expect(undersized).toEqual([]);
});

test('expert start money accepts zero and negative experiments without crashing', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await sandbox.scrollIntoViewIfNeeded();
  await sandbox.getByRole('button', { name: '123' }).click();
  const money = sandbox.getByRole('spinbutton', { name: 'start $ each, raw number' });
  await money.fill('0');
  await money.press('Tab');
  await expect(money).toHaveValue('0');
  await money.fill('-100');
  await money.press('Tab');
  await expect(money).toHaveValue('-100');
  expect(errors).toEqual([]);
});

test('prediction choices use native radio keyboard behavior', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(4);
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
});

test('one presentation key advances one authored stage beat and reverse goes back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const cow = page.locator('.pin-scene').nth(1);
  await cow.scrollIntoViewIfNeeded();
  const start = await page.evaluate(() => scrollY);
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
  const forward = await page.evaluate(() => scrollY);
  expect(forward).toBeGreaterThan(start);
  await page.keyboard.press('Shift+Space');
  await page.waitForTimeout(900);
  const reversed = await page.evaluate(() => scrollY);
  expect(reversed).toBeLessThan(forward);
});

test('authored scenes always release the reader past both boundaries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  for (const index of [1, 2, 3]) {
    const scene = page.locator('.pin-scene').nth(index);
    const spacer = scene.locator('..');
    await expect(spacer).toHaveClass(/pin-spacer/);
    const bounds = await spacer.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const start = box.top + scrollY;
      return { start, end: start + box.height - innerHeight };
    });

    await page.evaluate((y) => scrollTo(0, y), bounds.end - 2);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(bounds.end);

    await page.evaluate((y) => scrollTo(0, y), bounds.start + 2);
    await page.keyboard.press('Shift+Space');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(bounds.start);
  }
});

test('the cow scene releases a sustained wheel gesture at its final boundary', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const spacer = page.locator('.pin-scene').nth(1).locator('..');
  await expect(spacer).toHaveClass(/pin-spacer/);
  const end = await spacer.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return box.top + scrollY + box.height - innerHeight;
  });
  await page.evaluate((y) => scrollTo(0, y), end - 2);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 120);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(end);
});

test('the news dialog owns and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await sandbox.scrollIntoViewIfNeeded();
  const press = sandbox.getByRole('button', { name: '📸' });
  await press.click();
  await sandbox.locator('canvas').click({ position: { x: 100, y: 100 } });

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'keep trading' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(press).toBeFocused();
});

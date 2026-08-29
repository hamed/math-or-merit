import { expect, test } from '@playwright/test';
import { loadDeferred } from './helpers';

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

test('illustrated scene code and plates load one stage ahead instead of all at startup', async ({ page }) => {
  const responses: string[] = [];
  page.on('response', (response) => {
    responses.push(response.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  expect(responses.some((url) => url.includes('CowCastScene.svelte'))).toBe(true);
  expect(responses.some((url) => url.includes('/cast/'))).toBe(true);
  expect(responses.some((url) => url.includes('PersonTradeScene.svelte'))).toBe(false);
  expect(responses.some((url) => url.includes('/person/'))).toBe(false);
  expect(responses.some((url) => url.includes('/sandbox/Sandbox.svelte'))).toBe(false);

  await loadDeferred(page, 'trade scene', page.locator('.room-stage'));
  await expect.poll(() => responses.some((url) => url.includes('PersonTradeScene.svelte'))).toBe(true);
  await expect.poll(() => responses.some((url) => url.includes('/person/'))).toBe(true);
});

test('a slow deferred module keeps a stable loading surface and then mounts', async ({ page }) => {
  await page.route('**/Sandbox.svelte*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const marker = page.locator('[data-deferred="sandbox"]');
  await marker.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(marker).toHaveAttribute('aria-busy', 'true');
  await expect(marker).toContainText('Loading sandbox');
  await expect(page.locator('.sandbox.full')).toBeVisible();
});

test('a direct chapter link loads its deferred destination', async ({ page }) => {
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sandbox.full')).toBeVisible();
  await expect(page.locator('#sandbox')).toBeInViewport();
});

test('the sandbox stacks into a readable page on a short landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
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

test('the desktop sandbox aligns to the scrollbar-safe viewport edges', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'html { overflow-y: scroll !important; }' });
  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
  const edges = await sandbox.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return { left: box.left, right: box.right, viewport: document.documentElement.clientWidth };
  });
  expect(edges.left).toBeCloseTo(0, 0);
  expect(edges.right).toBeCloseTo(edges.viewport, 0);
});

test('expert start money accepts zero and negative experiments without crashing', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
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
  await loadDeferred(page, 'prediction', radios.first());
  await expect(radios).toHaveCount(4);
  await radios.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
});

test('one presentation key advances one authored stage beat and reverse goes back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
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

test('separate wheel gestures complete successive actions and reverse one action', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  const cow = page.locator('.pin-scene').nth(1);
  await cow.scrollIntoViewIfNeeded();
  const start = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(2500);
  const first = await page.evaluate(() => scrollY);
  expect(first).toBeGreaterThan(start);

  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(2200);
  const second = await page.evaluate(() => scrollY);
  expect(second).toBeGreaterThan(first);

  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(2200);
  const reversed = await page.evaluate(() => scrollY);
  expect(reversed).toBeLessThan(second);
});

test('a swipe completes one authored action', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  const cow = page.locator('.pin-scene').nth(1);
  await cow.scrollIntoViewIfNeeded();
  const start = await page.evaluate(() => scrollY);
  await page.evaluate(() => {
    const target = document.body;
    const begin = new Touch({ identifier: 1, target, clientX: 195, clientY: 700 });
    const end = new Touch({ identifier: 1, target, clientX: 195, clientY: 180 });
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [begin], bubbles: true, cancelable: true }));
    window.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(start);
});

test('authored scenes always release the reader past both boundaries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await loadDeferred(page, 'trade scene', page.locator('.room-stage'));
  for (const index of [1, 2]) {
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
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(bounds.end);
    const afterForward = await scene.boundingBox();
    expect(afterForward!.y + afterForward!.height).toBeLessThanOrEqual(1);

    await page.evaluate((y) => scrollTo(0, y), bounds.start + 2);
    await page.keyboard.press('Shift+Space');
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(bounds.start);
    expect((await scene.boundingBox())!.y).toBeGreaterThanOrEqual(899);
  }
});

test('scrolling after the cow’s final action brings the next section onscreen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  const spacer = page.locator('.pin-scene').nth(1).locator('..');
  await expect(spacer).toHaveClass(/pin-spacer/);
  const bounds = await spacer.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const start = box.top + scrollY;
    return { start, end: start + box.height - innerHeight };
  });
  await page.evaluate((y) => scrollTo(0, y), bounds.end - 2);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(bounds.end);
  const cow = page.locator('.pin-scene').nth(1);
  const cowBox = await cow.boundingBox();
  expect(cowBox!.y + cowBox!.height).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { name: 'Now, the spherical human' })).toBeInViewport();
});

test('the news dialog owns and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
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

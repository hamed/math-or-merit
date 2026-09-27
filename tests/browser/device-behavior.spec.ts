import { expect, test, type Page } from '@playwright/test';
import { loadDeferred } from './helpers';

/*
 * The essay as it reads since iteration 2 (2026-09-27): one step stage from the
 * title to the reader's own machine (ADR-017, ADR-018), three optional side
 * trips (the cow, the person who becomes a circle, and "All the dials" — the
 * whole old sandbox). The suite that tested the old scrolling widgets was
 * retired with them; the sandbox's own checks stay, entered through its side
 * trip.
 */

const STAGE_KEY = 'merit-or-math:stage:pair:v1';
/** The stage's holds, released so a test can land anywhere past them. */
const HOLDS = ['call.red', 'call.blue', 'equal', 'guess.what', 'guess.stake'];

const stage = (page: Page) => page.locator('.step-stage');
const stepNow = async (page: Page) => Number(await stage(page).getAttribute('data-step'));

async function stepIds(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const script = await import('/src/lib/widgets/stage/scenes/pair/script.ts');
    return script.PAIR_STEPS.map((s: { id: string }) => s.id);
  });
}

/**
 * Open the essay with the stage restored at step `id` — a step's name, or
 * `@keyline` for the first key line after both have been met (followed by
 * another) — holds released unless `holding`. Never a scene's label: the owner
 * renames those.
 */
async function openAt(page: Page, at: string, holding: readonly string[] = []): Promise<string[]> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const ids = await stepIds(page);
  const id =
    at === '@keyline'
      ? await page.evaluate(async () => {
          const { PAIR_STEPS, indexOf } = await import('/src/lib/widgets/stage/scenes/pair/script.ts');
          const met = indexOf('call.blue');
          const i = PAIR_STEPS.findIndex(
            (s: { wait: { kind: string } }, k: number) => k > met && s.wait.kind === 'reader' && PAIR_STEPS[k + 1]?.wait.kind === 'reader',
          );
          return PAIR_STEPS[i].id as string;
        })
      : at;
  await page.evaluate(
    ({ key, index, released }) => sessionStorage.setItem(key, JSON.stringify({ index, released })),
    { key: STAGE_KEY, index: ids.indexOf(id), released: HOLDS.filter((h) => !holding.includes(h)) },
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(stage(page)).toHaveAttribute('data-step', String(ids.indexOf(id)));
  await enterStage(page);
  return ids;
}

/** Rest the page with the stage exactly in view, the way a reader arrives in it. */
async function enterStage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const el = document.querySelector('.step-stage')!;
    scrollTo(0, Math.round(el.getBoundingClientRect().top + scrollY));
  });
  await page.waitForTimeout(350);
}

/** Opening a side trip scrolls to it smoothly; wait for the page to come to rest before placing it. */
async function openSideTrip(page: Page, id: string): Promise<void> {
  await page.locator(`[data-branch="${id}"] .offer`).click();
  await scrollSettled(page);
}

async function scrollSettled(page: Page): Promise<void> {
  let last = -1;
  await expect
    .poll(async () => {
      const y = await page.evaluate(() => scrollY);
      const still = y === last;
      last = y;
      return still;
    }, { intervals: [250], timeout: 10_000 })
    .toBe(true);
}

async function trackpadFlick(page: Page, direction: 1 | -1): Promise<void> {
  const curve = [3, 8, 15, 22, 25, 22, 18, 14, 11, 8, 6, 4.5, 3.3, 2.4, 1.7, 1.2, 0.8, 0.5, 0.3, 0.2];
  for (const d of curve) {
    await page.mouse.wheel(0, d * direction);
    await page.waitForTimeout(16);
  }
}

// ---- the stage -------------------------------------------------------------

test('the title fits a phone and the stage owns the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const title = page.locator('.pair-scene h1.title');
  await expect(title).toBeAttached();
  const box = await title.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const height = await stage(page).evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(844 - 1);
});

test('one key press is one step, and the reverse key goes back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, '@keyline');
  const start = await stepNow(page);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => stepNow(page)).toBe(start + 1);
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => stepNow(page)).toBe(start);
});

test('a trackpad flick and its inertia tail advance exactly one step', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, '@keyline');
  const start = await stepNow(page);
  await page.mouse.move(720, 450);
  await trackpadFlick(page, 1);
  await page.waitForTimeout(700);
  expect(await stepNow(page)).toBe(start + 1);
  await trackpadFlick(page, -1);
  await page.waitForTimeout(700);
  expect(await stepNow(page)).toBe(start);
});

test('a swipe is one step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAt(page, '@keyline');
  const start = await stepNow(page);
  await page.evaluate(() => {
    const target = document.body;
    const begin = new Touch({ identifier: 1, target, clientX: 195, clientY: 700 });
    const end = new Touch({ identifier: 1, target, clientX: 195, clientY: 180 });
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [begin], bubbles: true, cancelable: true }));
    window.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true, cancelable: true }));
  });
  await expect.poll(() => stepNow(page)).toBe(start + 1);
});

test('a hold waits for the reader: Red is called by a click, not by scrolling past', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'call.red', ['call.red', 'call.blue']);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(600);
  expect(await stepNow(page)).toBe(ids.indexOf('call.red'));
  await page.locator('.pair-scene .hit').first().click();
  await expect.poll(() => stepNow(page)).toBeGreaterThan(ids.indexOf('call.red'));
});

test('the chapter index stays in view while the stage waits for the reader', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, '@keyline');
  const index = page.locator('.index');
  await expect(index).toHaveClass(/shown/);
  await page.waitForTimeout(400);
  expect(await index.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(0, 0);
});

test('a reload returns the reader to the step they were reading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'gini.value');
  const at = await stepNow(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(stage(page)).toHaveAttribute('data-step', String(at));
});

test('past its last step the stage lets the page go on', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'sandbox.2');
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});

test('in the live tax game a click is a tap on the room, never a step', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'stop.how');
  await page.locator('.bubble .choice').first().click();
  await expect(page.locator('.meter')).toBeVisible();
  const taps = page.locator('.taps');
  await expect(taps).toBeVisible();
  const box = (await taps.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  expect(await stepNow(page)).toBe(ids.indexOf('stop.how'));
  // the reading keys still move on, and leaving ends the game
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => stepNow(page)).toBe(ids.indexOf('stop.how') + 1);
  await expect(page.locator('.meter')).toBeHidden();
});

test('the machine is the reader’s: Play trades, a tap photographs, and every dial is one link away', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'sandbox.2');
  await page.locator('.deck .primary').click();
  await expect
    .poll(async () => Number(((await page.locator('.chart.live .small').textContent()) ?? '0').replace(/[^\d]/g, '').slice(0, 9) || 0))
    .toBeGreaterThan(0);

  await page.locator('.deck-tap button').nth(1).click();
  const biggest = page.locator('.hit.tap').first();
  const at = (await biggest.boundingBox())!;
  await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
  await expect(page.locator('.bubble.paper')).toHaveCount(1);

  await page.locator('.bubble .choice').last().click();
  await expect(page.locator('.sandbox.full')).toBeVisible({ timeout: 15_000 });
});

// ---- the side trips ----------------------------------------------------------

test('illustrated side trips load nothing until the reader takes them', async ({ page }) => {
  const responses: string[] = [];
  page.on('response', (response) => responses.push(response.url()));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  for (const part of ['CowCastScene.svelte', '/cast/', 'PersonTradeScene.svelte', '/person/', '/sandbox/Sandbox.svelte']) {
    expect(responses.some((url) => url.includes(part)), part).toBe(false);
  }
  await openSideTrip(page, 'cow');
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await scrollSettled(page);
  await expect.poll(() => responses.some((url) => url.includes('CowCastScene.svelte'))).toBe(true);
});

test('the cow side trip releases the reader past both of its boundaries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await openSideTrip(page, 'cow');
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await scrollSettled(page);

  const scene = page.locator('.pin-scene').first();
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

  await page.evaluate((y) => scrollTo(0, y), bounds.start + 2);
  await page.keyboard.press('Shift+Space');
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(bounds.start);
});

test('scrolling after the cow’s final action brings its closing lines onscreen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await openSideTrip(page, 'cow');
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await scrollSettled(page);
  const spacer = page.locator('.pin-scene').first().locator('..');
  await expect(spacer).toHaveClass(/pin-spacer/);
  const end = await spacer.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return box.top + scrollY + box.height - innerHeight;
  });
  await page.evaluate((y) => scrollTo(0, y), end - 2);
  for (let index = 0; index < 60; index++) {
    await page.mouse.wheel(0, Math.max(3, Math.round(400 * Math.exp(-index / 9))));
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(end);
  const lineTop = await page.locator('[data-branch="cow"] .said').first().evaluate((el) => el.getBoundingClientRect().top);
  expect(lineTop).toBeLessThan(900);
});

// ---- "All the dials": the whole old sandbox, as a side trip -------------------

test('a direct link to the sandbox opens its side trip and lands on the machine', async ({ page }) => {
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sandbox.full')).toBeVisible();
  await expect(page.locator('#sandbox')).toBeInViewport();
});

test('a slow deferred module keeps a stable loading surface and then mounts', async ({ page }) => {
  await page.route('**/Sandbox.svelte*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const marker = page.locator('[data-deferred="sandbox"]');
  await expect(marker).toHaveAttribute('aria-busy', 'true');
  await expect(marker).toContainText('Loading sandbox');
  await expect(page.locator('.sandbox.full')).toBeVisible();
});

test('a deferred mount cannot pull navigation back to an obsolete hash target', async ({ page }) => {
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sandbox.full')).toBeVisible();
  await page.waitForTimeout(500);
  const movedTo = await page.evaluate(() => {
    history.replaceState(null, '', '#question');
    scrollTo(0, 400);
    document.dispatchEvent(new CustomEvent('merit-or-math:deferred-mounted'));
    return scrollY;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => scrollY)).toBe(movedTo);
});

test('the sandbox stacks into a readable page on a short landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
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

test('the sandbox opens as a fresh participation-first lab with one mobile plot in focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();

  await expect(sandbox.locator('[data-primary-metric]')).toHaveText('100.0 of 100 effective');
  await expect(sandbox.getByRole('slider', { name: 'levy every' })).toBeVisible();
  await expect(sandbox.locator('.plot:visible')).toHaveCount(1);
  await expect(sandbox.getByRole('button', { name: 'map', exact: true })).toHaveAttribute('aria-pressed', 'true');

  const phasePlot = sandbox.locator('.plot-phase');
  const beforeZoom = await phasePlot.boundingBox();
  await phasePlot.dblclick();
  await expect(phasePlot).toHaveClass(/zoomed/);
  const afterZoom = await phasePlot.boundingBox();
  expect(afterZoom!.height).toBeGreaterThan(beforeZoom!.height * 2);
  await phasePlot.getByRole('button', { name: 'Shrink the plot back' }).click();

  await sandbox.getByRole('button', { name: 'stake cut', exact: true }).click();
  const theoryPosition = await sandbox.locator('.plot-gstake').evaluate((plot) => ({
    line: Number(plot.querySelector('.theory')?.getAttribute('y1')),
    label: Number(plot.querySelector('.theory-label')?.getAttribute('y')),
  }));
  expect(theoryPosition.label).toBeLessThan(theoryPosition.line);

  await sandbox.getByRole('button', { name: 'histogram', exact: true }).click();
  await expect(sandbox.locator('.plot-hist')).toBeVisible();
  await expect(sandbox.locator('.plot-phase')).toBeHidden();

  await sandbox.locator('[data-map-metric]').click();
  await expect(sandbox.locator('[data-primary-metric]')).toHaveText('Gini 0.00');
  await expect(sandbox.locator('[data-map-metric]')).toHaveText('Gini');
});

test('the desktop sandbox aligns to the scrollbar-safe viewport edges', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'html { overflow-y: scroll !important; }' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
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
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
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

test('the news dialog owns and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await expect(sandbox).toBeVisible();
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

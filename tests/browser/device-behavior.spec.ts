import { expect, test, type Page } from '@playwright/test';
import { loadDeferred } from './helpers';

/*
 * The essay as it reads since iteration 2 (2026-09-27): one step stage from the
 * title to the reader's own machine (ADR-017, ADR-018), three optional side
 * trips (the person who becomes a circle, and "All the dials" — the
 * whole old sandbox). The suite that tested the old scrolling widgets was
 * retired with them; the sandbox's own checks stay, entered through its side
 * trip.
 */

const STAGE_KEY = 'merit-or-math:stage:pair:v1';
/** The stage's holds, released so a test can land anywhere past them. */
const HOLDS = ['meet', 'equal', 'more.joke', 'guess.what', 'guess.stake', 'eff.try'];

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
          const met = indexOf('meet');
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

test('under reduced motion the faces follow a room scrubbed back to its start', async ({ page }) => {
  // reduced motion on before the stage mounts
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'dial.7');
  // each room member's face, by its slot: the room draws them in a new order as fortunes change
  const faces = () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll<SVGGElement>('svg.art g.room g.face')].map((g) => [g.dataset.slot, [...g.querySelectorAll('path')].map((p) => p.getAttribute('d')).join('|')]),
      ),
    );
  await page.getByRole('button', { name: 'To the end' }).first().click();
  await page.waitForTimeout(300);
  const end = await faces();
  await page.getByRole('button', { name: 'Back to the start' }).first().click();
  await page.waitForTimeout(300);
  const start = await faces();
  const slots = Object.keys(end);
  expect(slots.length).toBeGreaterThan(90);
  // everyone equal again, and every face drawn for it: not the end's faces left on the start's bodies
  const kept = slots.filter((slot) => start[slot] === end[slot]).length;
  expect(kept).toBeLessThan(slots.length / 2);
});

test('the matched room’s copies show the same faces at the same moment, however the reader scrubbed there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'match.result');
  const copies = () =>
    page.evaluate(() =>
      [...document.querySelectorAll<SVGGElement>('svg.art g.face[data-mirror]')].map((g) => `${g.dataset.mirror}:${[...g.querySelectorAll('path')].map((p) => p.getAttribute('d')).join('|')}`),
    );
  const end = page.getByRole('button', { name: 'To the end' }).first();
  await end.click();
  await page.waitForTimeout(300);
  const first = await copies();
  await page.getByRole('button', { name: 'Back to the start' }).first().click();
  await page.waitForTimeout(300);
  await end.click();
  await page.waitForTimeout(300);
  expect(first.length).toBe(2);
  expect(await copies()).toEqual(first);
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

test('the two call the reader in turns, never over each other, Red first', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'meet', ['meet']);
  const lines = await page.evaluate(async () => {
    const { REACTIONS } = await import('/src/lib/widgets/stage/scenes/pair/script.ts');
    const messages = (await import('/messages/en.json')).default as Record<string, string>;
    return { red: REACTIONS.callRed.map((k: string) => messages[k]), blue: REACTIONS.callBlue.map((k: string) => messages[k]) };
  });
  // each new call, in the order it was said
  const heard: string[] = [];
  for (let k = 0; k < 30 && heard.length < 4; k++) {
    const shown = (await page.locator('.pair-scene .bubble .lines').allTextContents()).map((t) => t.trim());
    for (const line of shown) if (!heard.includes(line)) heard.push(line);
    await page.waitForTimeout(300);
  }
  expect(heard.slice(0, 4)).toEqual([lines.red[0], lines.blue[0], lines.red[1], lines.blue[1]]);
  // one call on screen at a time
  const calls = [...lines.red, ...lines.blue];
  const shown = (await page.locator('.pair-scene .bubble .lines').allTextContents()).map((t) => t.trim());
  expect(shown.filter((t) => calls.includes(t)).length).toBeLessThanOrEqual(1);
});

test('a bubble of several lines shows them one after another', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'rules.1');
  await page.mouse.move(2, 2);
  await page.keyboard.press('ArrowRight');
  const second = page.locator('.pair-scene .bubble').last().locator('.line').nth(1);
  await expect(second).toBeAttached();
  expect(Number(await second.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.1);
  await expect.poll(async () => Number(await second.evaluate((el) => getComputedStyle(el).opacity)), { timeout: 4000 }).toBeGreaterThan(0.9);
});

test('a hold waits for the reader: both are met by a click each, in any order, never by scrolling past', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'meet', ['meet']);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(600);
  expect(await stepNow(page)).toBe(ids.indexOf('meet'));
  // one met: still waiting for the other
  await page.locator('.pair-scene .hit').last().click();
  await page.waitForTimeout(400);
  expect(await stepNow(page)).toBe(ids.indexOf('meet'));
  await page.locator('.pair-scene .hit').first().click();
  await expect.poll(() => stepNow(page)).toBeGreaterThan(ids.indexOf('meet'));
});

test('the chapter index stays in view while the stage waits for the reader', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, '@keyline');
  const index = page.locator('.index');
  await expect(index).toHaveClass(/shown/);
  await page.waitForTimeout(400);
  expect(await index.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(0, 0);
});

test('the index lists the story’s parts, one entry each, never their scenes, and a part opens at its first scene', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, '@keyline');
  const parts = await page.evaluate(async () => {
    const { STORY } = await import('/src/lib/content/story.gen.ts');
    const out: { act: string; titles: string[]; at: number; trip: boolean }[] = [];
    for (const sc of STORY.scenes) {
      const last = out[out.length - 1];
      if (last && last.act === sc.act) last.titles.push(sc.title);
      else out.push({ act: sc.act, titles: [sc.title], at: STORY.steps.findIndex((s: { id: string }) => s.id === sc.step), trip: !!sc.sideTrip });
    }
    return out;
  });
  // the pointer resting on the line opens it
  await page.locator('.index .here').hover();
  const entries = page.locator('#scene-list .part');
  await expect(entries).toHaveCount(parts.length);
  const texts = (await entries.allTextContents()).map((t) => t.trim());
  // a part of several scenes is one entry: its later scenes are not listed
  const several = parts.find((p) => !p.trip && p.titles.length > 1 && p.titles.slice(1).every((t) => t !== p.act))!;
  for (const title of several.titles.slice(1)) expect(texts.some((t) => t.endsWith(title))).toBe(false);
  await entries.nth(parts.indexOf(several)).click();
  await expect.poll(() => stepNow(page)).toBe(several.at);
});

test('a link to a scene opens the stage there, and the address follows the scene', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  const gini = await page.evaluate(async () => {
    const { STORY } = await import('/src/lib/content/story.gen.ts');
    const sc = STORY.scenes.find((s: { label: string }) => s.label === 'gini')!;
    return STORY.steps.findIndex((s: { id: string }) => s.id === sc.step);
  });
  await expect.poll(() => stepNow(page)).toBe(gini);
  await expect(stage(page)).toBeInViewport({ ratio: 0.9 });
  // moving on, the address names the scene the reader is in
  await openAt(page, 'count.2');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#count');
});

test('a stray click or scroll during a run does not skip it; Skip does', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'run.1');
  await page.keyboard.press('ArrowRight');
  const skip = page.locator('.pair-scene .skip');
  await expect(skip).toBeVisible();
  const at = await stepNow(page);
  await page.mouse.click(640, 400);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(600);
  expect(await stepNow(page)).toBe(at);
  await expect(skip).toBeVisible();
  await expect(skip).toHaveClass(/called/);
  await skip.click();
  await expect(skip).toBeHidden();
});

test('chit-chat goes on when a bubble arrives under a pointer that stands still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'rules.1');
  const at = await stepNow(page);
  // the pointer waits, still, just above the line on screen: the talk slides up under it
  const box = (await page.locator('.pair-scene .bubble').last().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y - 60);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => stepNow(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(at + 3);
});

test('the rule card opens empty and fills as Red tells the rule', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const rule = page.locator('.charts .chart.rule li');
  const ids = await openAt(page, 'rule.1');
  await expect(page.locator('.charts .chart.rule h3')).toBeVisible();
  await expect(rule).toHaveCount(0);
  await openAt(page, ids[ids.indexOf('rule.1') + 2]);
  await expect(rule).toHaveCount(2);
});

test('the four are a puzzle: a scroll or a missed tap stays, and making each number in turn goes on', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAt(page, 'eff.try', ['eff.try']);
  const at = await stepNow(page);
  const four = page.locator('.pair-scene .hit.four');
  await expect(four).toHaveCount(4);
  const coins = async () => Promise.all([0, 1, 2, 3].map(async (k) => (await four.nth(k).getAttribute('aria-label'))!.replace(/[^\d]/g, '')));
  await expect.poll(coins).toEqual(['2', '2', '2', '2']);
  await page.keyboard.press('ArrowDown');
  await page.mouse.click(60, 400);
  await page.waitForTimeout(400);
  expect(await stepNow(page)).toBe(at);
  // a coin dragged from the first to the second
  const a = (await four.nth(0).boundingBox())!;
  const b = (await four.nth(1).boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(coins).toEqual(['1', '3', '2', '2']);
  // a coin by taps: one, then the other
  const give = async (from: number, to: number, times = 1) => {
    for (let t = 0; t < times; t++) {
      await four.nth(from).click();
      await four.nth(to).click();
    }
  };
  // make it 2: four and four
  await give(2, 0, 2);
  await give(3, 0);
  await give(3, 1);
  await expect.poll(coins).toEqual(['4', '4', '0', '0']);
  expect(await stepNow(page)).toBe(at);
  // make it 1: one holds all eight
  await expect(page.locator('.bubble').filter({ hasText: /make it 1\b/ })).toBeVisible();
  await give(1, 0, 4);
  // about 2.9: four, one, one, two
  await expect(page.locator('.bubble').filter({ hasText: /2\.9/ })).toBeVisible();
  await give(0, 1);
  await give(0, 2);
  await give(0, 3, 2);
  await expect.poll(() => stepNow(page)).toBe(at + 1);
});

test('stepping back and forth through the told round leaves no timelines behind', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  const ids = await openAt(page, 'rule.1');
  const children = () =>
    page.evaluate(async () => (await import('/src/lib/widgets/stage/gsap.ts')).gsap.globalTimeline.getChildren(false, true, true).length);
  const counts: number[] = [];
  for (let k = 0; k < 8; k++) {
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => stepNow(page)).toBe(ids.indexOf('rule.1') + 1);
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => stepNow(page)).toBe(ids.indexOf('rule.1'));
    await page.waitForTimeout(150);
    counts.push(await children());
  }
  // bounded: the last cycles keep no more than the first did
  expect(Math.max(...counts.slice(-3))).toBeLessThanOrEqual(counts[1] + 2);
});

test('a line about a spot rings it, and only while the line shows', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const ids = await openAt(page, 'sort.there');
  await expect(page.locator('.point-ring')).toHaveCount(1);
  await openAt(page, ids[ids.indexOf('sort.there') + 1]);
  await expect(page.locator('.point-ring')).toHaveCount(0);
});

test('any card in the deck can be picked, not only the top one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'gini.value');
  // under the pointer the deck fans out; from the keyboard, pressing it does
  await page.locator('.cards .stack').focus();
  await page.keyboard.press('Enter');
  const tabs = page.locator('.cards .tab');
  expect(await tabs.count()).toBeGreaterThan(1);
  // the oldest, at the bottom of the pile
  const title = ((await tabs.last().textContent()) ?? '').trim();
  await tabs.last().click();
  await expect(page.locator('.cards .card h2')).toHaveText(title);
});

test('the joke is told in the talk, pictures and all, or skipped', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'more.joke', ['more.joke']);
  const choices = page.locator('.bubble .choice');
  // "Not now": past the joke, to what follows it
  await choices.nth(1).click();
  const past = await page.evaluate(async () => (await import('/src/lib/widgets/stage/scenes/pair/script.ts')).JOKE_SKIP as string);
  await expect.poll(() => stepNow(page)).toBe(ids.indexOf(past));
  // "Yes": the joke, its plates posted in the talk
  await openAt(page, 'more.joke', ['more.joke']);
  await page.locator('.bubble .choice').first().click();
  await expect.poll(() => stepNow(page)).toBe(ids.indexOf('more.joke') + 1);
  await expect(page.locator('.bubble .pictures img').first()).toBeVisible();
});

test('the levy is reviewed for both rooms, side by side', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'match.result');
  const last = await page.evaluate(async () => {
    const { PAIR_STEPS } = await import('/src/lib/widgets/stage/scenes/pair/script.ts');
    const matched = PAIR_STEPS.filter((s: { pose: { roomMode: string } }) => s.pose.roomMode === 'matched');
    return { id: matched.at(-1).id as string, measures: matched.at(-1).pose.compare.length as number };
  });
  await openAt(page, last.id);
  const rows = page.locator('.compared .pair-row');
  await expect(rows).toHaveCount(last.measures);
  for (let k = 0; k < last.measures; k++) await expect(rows.nth(k).locator('.plot')).toHaveCount(2);
  expect(ids.indexOf(last.id)).toBeGreaterThan(ids.indexOf('match.result'));
});

test('the tax game starts from the room itself, and shows what a tap takes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'stop.how');
  await page.locator('.start-game').click();
  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.start-game')).toHaveCount(0);
});

test('the tax game ends on a card: a stray click stays, Play again plays, Go on moves on', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const ids = await openAt(page, 'stop.how');
  await page.locator('.start-game').click();
  // left alone, the room closes
  const over = page.locator('.game-over');
  await expect(over).toBeVisible({ timeout: 60_000 });
  await page.mouse.click(40, 450);
  await page.waitForTimeout(400);
  expect(await stepNow(page)).toBe(ids.indexOf('stop.how'));
  await over.getByRole('button').last().click();
  await expect.poll(() => stepNow(page)).toBe(ids.indexOf('stop.how') + 1);
});

test('a reload returns the reader to the step they were reading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'gini.value');
  const at = await stepNow(page);
  // the address names the scene by now; coming back is still to the very step
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#gini');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(stage(page)).toHaveAttribute('data-step', String(at));
  await page.waitForTimeout(800);
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
  await expect(page.locator('.hud')).toBeVisible();
  const taps = page.locator('.taps');
  await expect(taps).toBeVisible();
  const box = (await taps.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  expect(await stepNow(page)).toBe(ids.indexOf('stop.how'));
  // the reading keys still move on, and leaving ends the game
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => stepNow(page)).toBe(ids.indexOf('stop.how') + 1);
  await expect(page.locator('.hud')).toBeHidden();
});

test('the machine is the reader’s: Play trades, a tap photographs, and every dial is one link away', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAt(page, 'sandbox.2');
  await page.locator('.deck .primary').click();
  await expect
    .poll(async () => Number(((await page.locator('.chart.live .after').textContent()) ?? '0').replace(/[^\d]/g, '').slice(0, 9) || 0))
    .toBeGreaterThan(0);

  await page.locator('.deck-tap button').nth(1).click();
  // the biggest fortune the reader can reach: the talk may sit over part of the room, and a click there is the talk's
  const reachable = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.hit.tap')].findIndex((el) => {
      const b = el.getBoundingClientRect();
      return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === el;
    }),
  );
  expect(reachable).toBeGreaterThanOrEqual(0);
  await page.locator('.hit.tap').nth(reachable).click();
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
  for (const part of ['PersonTradeScene.svelte', '/person/', '/sandbox/Sandbox.svelte']) {
    expect(responses.some((url) => url.includes(part)), part).toBe(false);
  }
  // the joke's plates are pictures in the talk now: none is fetched before the joke is told
  expect(responses.some((url) => url.includes('/cast/') && /\.webp(\?(?!import)|$)/.test(url)), 'a plate').toBe(false);
  await openSideTrip(page, 'human');
  await loadDeferred(page, 'the spherical human', page.locator('[data-branch="human"] .pin-scene'));
  await scrollSettled(page);
  await expect.poll(() => responses.some((url) => url.includes('PersonTradeScene.svelte'))).toBe(true);
});

test('a side trip releases the reader past both of its boundaries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await openSideTrip(page, 'human');
  await loadDeferred(page, 'the spherical human', page.locator('[data-branch="human"] .pin-scene'));
  await scrollSettled(page);

  const scene = page.locator('[data-branch="human"] .pin-scene').first();
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

test('scrolling after a side trip’s final action brings its closing choices onscreen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await openSideTrip(page, 'human');
  await loadDeferred(page, 'the spherical human', page.locator('[data-branch="human"] .pin-scene'));
  await scrollSettled(page);
  const spacer = page.locator('[data-branch="human"] .pin-scene').first().locator('..');
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
  const choicesTop = await page.locator('[data-branch="human"] .choice-row').first().evaluate((el) => el.getBoundingClientRect().top);
  expect(choicesTop).toBeLessThan(900);
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

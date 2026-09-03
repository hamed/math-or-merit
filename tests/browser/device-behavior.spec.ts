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

test('the earned conclusion hands the final guided position to the sandbox', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const finalChapters = await page.locator('.chapter-anchor').evaluateAll((anchors) =>
    anchors.slice(-2).map((anchor) => anchor.id),
  );
  expect(finalChapters).toEqual(['verdict', 'sandbox']);
  await expect(page.getByText('The machine is yours. Break my argument.')).toHaveCount(1);
  await expect(page.locator('[data-deferred="closing scene"]')).toHaveCount(0);
});

test('a deferred mount cannot pull navigation back to an obsolete hash target', async ({ page }) => {
  await page.goto('/#run', { waitUntil: 'domcontentloaded' });
  await loadDeferred(page, 'main run', page.locator('[data-guided-run]'));
  await page.waitForTimeout(500);

  const movedTo = await page.evaluate(() => {
    history.replaceState(null, '', '#sandbox');
    scrollTo(0, 3000);
    document.dispatchEvent(new CustomEvent('merit-or-math:deferred-mounted'));
    return scrollY;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => scrollY)).toBe(movedTo);
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

test('the sandbox opens as a fresh participation-first lab with one mobile plot in focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#sandbox', { waitUntil: 'domcontentloaded' });
  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);

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

test('a guided outcome remains available when the reader reaches the sandbox', async ({ page }) => {
  await page.addInitScript(() => {
    const protocol = {
      version: 2,
      n: 100,
      tradesPerRound: 100,
      levyEveryRounds: 1,
      trades: 200_000,
      burnIn: 120_000,
      tailSamples: 8,
    };
    localStorage.setItem('merit-or-math:outcome-points:v2', JSON.stringify({
      schemaVersion: 2,
      cells: {
        priorA: { protocol, stake: 0.1, tax: 0.01, metrics: { gini: { sum: 0.4, count: 1 } } },
        priorB: { protocol, stake: 0.3, tax: 0.03, metrics: { gini: { sum: 0.6, count: 1 } } },
      },
    }));
  });
  await page.goto('/#tax-against-trade', { waitUntil: 'domcontentloaded' });
  const guidedMap = page.locator('[aria-label^="Play rooms with a stake and a levy dial"]');
  await loadDeferred(page, 'outcome map', guidedMap);
  await guidedMap.getByRole('button', { name: 'Run this room' }).click();
  await expect(guidedMap.getByText(/1 room run and painted/)).toBeVisible({ timeout: 12_000 });
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('merit-or-math:outcome-points:v2');
    return raw ? Object.keys(JSON.parse(raw).cells).length : 0;
  })).toBe(3);

  await page.evaluate(() => { location.hash = 'sandbox'; });
  const sandbox = page.locator('.sandbox.full');
  await loadDeferred(page, 'sandbox', sandbox);
  await expect(sandbox.locator('.plot-phase .cell')).toHaveCount(1);
  await expect(sandbox.locator('.plot-phase .cell title')).toContainText('effective participants');
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

test('the chapter index remains fixed to the viewport while the body is a size container', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => scrollTo(0, 1800));

  const index = page.locator('.index');
  await expect(index).toHaveClass(/shown/);
  await page.waitForTimeout(400);
  expect(await index.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(0, 0);
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

test('a running stake dial idles at zero and resumes above zero', async ({ page }) => {
  await page.goto('/#dial', { waitUntil: 'domcontentloaded' });
  const dial = page.locator('[aria-label="Vary the stake and watch the speed change"]');
  await loadDeferred(page, 'stake dial', dial);

  await dial.getByRole('button', { name: 'Run', exact: true }).click();
  const stake = dial.getByRole('slider', { name: "Stake as a percentage of the poorer trader's wealth" });
  const setStake = (value: string) => stake.evaluate((input, next) => {
    (input as HTMLInputElement).value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);

  await setStake('0');
  await expect(dial.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(dial.locator('output')).toHaveText('0 trades');

  await setStake('20');
  await expect.poll(() => dial.locator('output').textContent()).not.toBe('0 trades');
  await expect(dial.getByText('Gini', { exact: true })).toBeVisible();
  await expect(dial.getByText('effective participants', { exact: true })).toBeVisible();
  await expect(dial.getByText('turnover / round', { exact: true })).toBeVisible();
});

test('the Gini lesson still builds the Lorenz gap from first principles', async ({ page }) => {
  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[aria-label="Building the Gini coefficient from twelve circles"]');
  await loadDeferred(page, 'Gini stage', stage);

  await stage.getByRole('button', { name: 'Add them up' }).click();
  await expect(stage.getByRole('button', { name: 'Now, an unequal room' })).toBeVisible({ timeout: 6000 });
  await stage.getByRole('button', { name: 'Now, an unequal room' }).click();
  await stage.getByRole('button', { name: 'Sort them' }).click();
  await stage.getByRole('button', { name: 'Add them up' }).click();

  await expect(stage.getByText(/Gini = the hatched gap/)).toBeVisible({ timeout: 6000 });
  await expect(stage.getByText(/Gini ≈/)).toBeVisible();
});

test('dragging the real coin between room circles changes effective participants and can be undone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[aria-label="Explore effective participants by moving coins in a four-person room"]');
  await loadDeferred(page, 'effective participants stage', stage);
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await expect(stage.locator('output')).toContainText('4.00');

  const firstCoin = stage.getByRole('button', { name: 'Coin 1, held by person 1' });
  const coin = stage.getByRole('button', { name: 'Coin 5, held by person 2' });
  const destination = stage.locator('.drop-target[data-holder="0"]');

  await firstCoin.click();
  await coin.click();
  await expect(firstCoin).toHaveAttribute('aria-pressed', 'false');
  await expect(coin).toHaveAttribute('aria-pressed', 'true');
  await expect(stage.locator('output')).toContainText('4.00');
  await expect(stage.getByRole('button', { name: 'Undo one move' })).toBeDisabled();
  await coin.press('Escape');
  await expect(coin).toHaveAttribute('aria-pressed', 'false');

  await firstCoin.focus();
  await firstCoin.press('Enter');
  await page.keyboard.press('Tab');
  await expect(stage.getByRole('button', { name: 'Move selected coin to person 1' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(firstCoin).toHaveAttribute('aria-pressed', 'false');

  const roomLayer = await stage.locator('.coin-layer').boundingBox();
  await coin.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  let from = await coin.boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(roomLayer!.x + roomLayer!.width / 2, roomLayer!.y + 5, { steps: 8 });
  await page.mouse.up();
  await expect(coin).toHaveAttribute('aria-pressed', 'true');
  await coin.click();
  await expect(coin).toHaveAttribute('aria-pressed', 'false');

  from = await coin.boundingBox();
  const to = await destination.boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(stage.locator('output')).toContainText('3.88');
  await stage.getByRole('button', { name: 'Undo one move' }).click();
  await expect(stage.locator('output')).toContainText('4.00');
});

test('selecting coins and room circles concentrates the square room on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('[aria-label="Explore effective participants by moving coins in a four-person room"]');
  await loadDeferred(page, 'effective participants stage', stage);
  await stage.scrollIntoViewIfNeeded();

  for (const coin of [5, 9, 13]) {
    await stage.getByRole('button', { name: `Coin ${coin}, held by person ${coin === 5 ? 2 : coin === 9 ? 3 : 4}` }).click();
    const destination = await stage.getByRole('button', { name: 'Move selected coin to person 1' }).boundingBox();
    await page.mouse.click(destination!.x + destination!.width * 0.82, destination!.y + destination!.height / 2);
  }

  await expect(stage.locator('output')).toContainText('3.37');
  expect(await stage.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await stage.getByRole('button', { name: 'Restore equality' }).click();
  await expect(stage.locator('output')).toContainText('4.00');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(stage.locator('output')).toContainText('4.00');
  expect(await stage.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('the larger room reports all three measurements from one run', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#crowd', { waitUntil: 'domcontentloaded' });
  const crowd = page.locator('[aria-label="A thousand traders, two million trades, on the multiplying ruler"]');
  await loadDeferred(page, 'crowd run', crowd);

  await expect(crowd.getByText('Gini', { exact: true })).toBeVisible();
  await expect(crowd.getByText('effective participants', { exact: true })).toBeVisible();
  await expect(crowd.getByText('ordinary turnover', { exact: true })).toBeVisible();
  await expect(crowd.getByText('1000.0 of 1000', { exact: true })).toBeVisible();
  expect(await crowd.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await crowd.getByRole('button', { name: 'Trade two million times' }).click();
  await expect(crowd.getByRole('button', { name: 'Run it again' })).toBeVisible({ timeout: 10_000 });
  const effective = await crowd.getByText(/of 1000$/).textContent();
  expect(Number(effective!.split(' ')[0])).toBeLessThan(1000);
  await expect(crowd.getByText(/the last round moved/)).toBeVisible();
});

test('the manual intervention game measures the field instead of punishing a winner', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#stop-it', { waitUntil: 'domcontentloaded' });
  const game = page.locator('[aria-label="A live trading room where manual levies keep participation open"]');
  await loadDeferred(page, 'tax game', game);

  await expect(game.getByText(/effective participants:/)).toBeVisible();
  await expect(game.getByText('Gini:', { exact: false })).toHaveCount(0);
  await expect(game.locator('.caption')).not.toHaveAttribute('aria-live');
  const announcement = game.locator('[data-game-announcement]');
  await expect(announcement).toHaveAttribute('aria-live', 'polite');

  const participationFill = game.locator('.meter-fill.participation');
  const normalBackground = await participationFill.evaluate((element) => getComputedStyle(element).backgroundImage);
  await participationFill.evaluate((element) => element.classList.add('alarming'));
  const alarmingBackground = await participationFill.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(alarmingBackground).not.toBe(normalBackground);
  await participationFill.evaluate((element) => element.classList.remove('alarming'));

  await game.getByRole('button', { name: 'Start the room' }).click();
  await expect(game.getByText('largest holders:', { exact: true })).toBeVisible();
  const manualLevy = game.getByRole('button', { name: /Apply the manual levy/ }).first();
  await expect(manualLevy).toBeVisible();
  await expect(manualLevy).toHaveAccessibleName(/currently \d+%/);
  const liveMutations = await announcement.evaluate((element) => new Promise<number>((resolve) => {
    let count = 0;
    const observer = new MutationObserver((records) => { count += records.length; });
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(count);
    }, 700);
  }));
  expect(liveMutations).toBeLessThanOrEqual(2);
  await game.getByRole('button', { name: 'Pause' }).click();
  expect(await game.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('the levy lesson keeps collection, return, and final wealth in separate reversible states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#levy', { waitUntil: 'domcontentloaded' });
  const lesson = page.locator('[aria-label="A reversible lesson showing a proportional wealth levy and equal return"]');
  await loadDeferred(page, 'levy lesson', lesson);

  await expect(lesson.getByText('Four fortunes. One rule will touch all four.')).toBeVisible();
  await expect(lesson.locator('.levy-coin:not(.hidden)')).toHaveCount(0);

  await lesson.getByRole('button', { name: 'Take the same 25%' }).click();
  await expect(lesson.getByText(/Three give one coin/)).toBeVisible();
  await expect(lesson.locator('.levy-coin:not(.hidden)')).toHaveCount(8);

  await lesson.getByRole('button', { name: 'Make one pool' }).click();
  await expect(lesson.getByText('Eight coins enter one common pool.')).toBeVisible();
  await lesson.getByRole('button', { name: 'Divide it equally' }).click();
  await expect(lesson.getByText(/four equal shares/)).toBeVisible();
  await lesson.getByRole('button', { name: 'Return it to the room' }).click();
  await expect(lesson.getByText('Return one equal share to each person.')).toBeVisible();

  await lesson.getByRole('button', { name: 'Count the result' }).click();
  await expect(lesson.getByText(/each smaller fortune gains one coin/)).toBeVisible();
  await expect(lesson.locator('.levy-coin:not(.hidden)')).toHaveCount(0);
  await lesson.getByRole('button', { name: 'Step back' }).click();
  await expect(lesson.getByText('Return one equal share to each person.')).toBeVisible();
  await expect(lesson.locator('.levy-coin:not(.hidden)')).toHaveCount(8);

  await lesson.getByRole('button', { name: 'Count the result' }).click();
  await lesson.getByRole('button', { name: 'Repeat until equal' }).click();
  await expect(lesson.getByText(/room is equal to the eye/)).toBeVisible({ timeout: 10_000 });
  await expect(lesson.locator('.levy-coin:not(.hidden)')).toHaveCount(0);
  await expect(lesson.locator('output')).toHaveText(/round \d+/);
  await lesson.getByRole('button', { name: 'Step back' }).click();
  await expect(lesson.getByText(/The same rule pulls every fortune/)).toBeVisible();
  await expect(lesson.getByRole('button', { name: 'Keep going' })).toBeVisible();
  expect(await lesson.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 844, height: 390 });
  expect(await lesson.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('matched rooms share luck and report participation and levy-free turnover', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 47 / 0x1_0000_0000;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#tax-against-trade', { waitUntil: 'domcontentloaded' });
  const comparison = page.locator('[aria-label="Two matched rooms compare fair trades without and with a shared counterforce"]');
  await loadDeferred(page, 'matched room comparison', comparison);

  await expect(comparison.getByText('Same partners. Same tosses. One changed rule.')).toBeVisible();
  await expect(comparison.locator('.caption')).not.toHaveAttribute('aria-live');
  const announcement = comparison.locator('[data-matched-announcement]');
  const control = comparison.getByRole('region', { name: 'Matched room without a levy' });
  const treatment = comparison.getByRole('region', { name: 'Matched room with a levy and equal return' });
  await expect(announcement).toHaveText('Matched rooms ready.');
  await expect(control.getByText('effective participants now', { exact: true })).toBeVisible();
  await expect(control.getByText('late-run ordinary turnover', { exact: true })).toBeVisible();
  await comparison.getByRole('button', { name: 'Run both rooms' }).click();
  await expect(comparison.getByRole('button', { name: 'Run another matched pair' })).toBeVisible({ timeout: 10_000 });

  const value = async (section: typeof control, row: number) =>
    Number((await section.locator('.measurements strong').nth(row).textContent())!.split(' ')[0]);
  expect(await value(treatment, 0)).toBeGreaterThan(await value(control, 0));
  expect(await value(treatment, 1)).toBeGreaterThan(await value(control, 1));
  await expect(comparison.getByText(/Same random script/)).toBeVisible();
  await expect(comparison.getByText(/Across four late-run measurements/)).toBeVisible();
  await expect(announcement).toContainText('Matched comparison complete. The late-run averages');
  expect(await comparison.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 844, height: 390 });
  expect(await comparison.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
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

test('the main run groups start, active reversal, completion, and interpretation into separate actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#run', { waitUntil: 'domcontentloaded' });
  const guided = page.locator('[data-guided-run]');
  await loadDeferred(page, 'main run', guided);
  await guided.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  const waiting = page.getByText('The room has not answered yet. Run it above; the interpretation can wait.');
  await expect(waiting).toBeAttached();

  await page.keyboard.press('Space');
  await expect(guided.getByRole('button', { name: 'Trading…' })).toBeDisabled();

  await page.keyboard.press('Shift+Space');
  await expect(guided.locator('output')).toHaveText('0 trades');
  await expect(waiting).toBeAttached();

  await page.keyboard.press('Space');

  await page.keyboard.press('Space');
  await expect(guided.locator('output')).toHaveText('100,000 trades');
  await expect(page.getByText(/The largest shape in this run holds/)).toBeAttached();
  const firstShare = await guided.locator('.meter-label').textContent();

  // NewsFlash focuses its own button; guided keys still reach the page, while
  // a completed result remains intact for readers scrolling back to reread it.
  const beforeReread = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowUp');
  await expect(guided.locator('output')).toHaveText('100,000 trades');
  await expect(guided.locator('.meter-label')).toHaveText(firstShare!);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(beforeReread);
});

test('one wheel gesture cannot both start and finish the main run', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#run', { waitUntil: 'domcontentloaded' });
  const guided = page.locator('[data-guided-run]');
  await loadDeferred(page, 'main run', guided);
  await guided.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  for (const delta of [240, 160, 90, 45, 20]) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(16);
  }
  await expect(guided.getByRole('button', { name: 'Trading…' })).toBeDisabled();

  await page.waitForTimeout(350);
  await page.mouse.wheel(0, 240);
  await expect(guided.locator('output')).toHaveText('100,000 trades');
});

test('mobile swipes reverse an active run and preserve a completed result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#run', { waitUntil: 'domcontentloaded' });
  const guided = page.locator('[data-guided-run]');
  await loadDeferred(page, 'main run', guided);
  await guided.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  const swipe = (from: number, to: number) => page.evaluate(({ from, to }) => {
    const target = document.body;
    const begin = new Touch({ identifier: 8, target, clientX: 195, clientY: from });
    const end = new Touch({ identifier: 8, target, clientX: 195, clientY: to });
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [begin], bubbles: true, cancelable: true }));
    window.dispatchEvent(new TouchEvent('touchmove', { touches: [end], bubbles: true, cancelable: true }));
    window.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], bubbles: true, cancelable: true }));
  }, { from, to });

  await swipe(700, 180);
  await expect(guided.getByRole('button', { name: 'Trading…' })).toBeDisabled();
  await swipe(180, 700);
  await expect(guided.locator('output')).toHaveText('0 trades');
  await swipe(700, 180);
  await swipe(700, 180);
  await expect(guided.locator('output')).toHaveText('100,000 trades');
  await swipe(180, 700);
  await expect(guided.locator('output')).toHaveText('100,000 trades');
});

test('a horizontal trackpad gesture does not drive the main run', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#run', { waitUntil: 'domcontentloaded' });
  const guided = page.locator('[data-guided-run]');
  await loadDeferred(page, 'main run', guided);
  await guided.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  await page.evaluate(() => {
    for (let index = 0; index < 4; index++) {
      window.dispatchEvent(new WheelEvent('wheel', { deltaX: 120, deltaY: 0, bubbles: true, cancelable: true }));
    }
  });
  await expect(guided.locator('output')).toHaveText('0 trades');
  await expect(guided.getByRole('button', { name: /Run 100,000 trades/ })).toBeEnabled();
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

test('a new wheel gesture is not swallowed while a long stage step is still moving', async ({ browser }) => {
  async function resultingScroll(gestures: number, gapMs = 350): Promise<number> {
    const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
    await page.locator('.pin-scene').nth(1).scrollIntoViewIfNeeded();

    await page.mouse.wheel(0, 240);
    if (gestures === 2) {
      await page.waitForTimeout(gapMs);
      await page.mouse.wheel(0, 240);
    }
    await page.waitForTimeout(4_000);
    const result = await page.evaluate(() => scrollY);
    await page.close();
    return result;
  }

  const oneGesture = await resultingScroll(1);
  const twoGestures = await resultingScroll(2);
  const twoSettledGestures = await resultingScroll(2, 2_500);
  expect(twoGestures).toBeCloseTo(twoSettledGestures, 0);
  expect(twoGestures).toBeGreaterThan(oneGesture);
});

test('a trackpad inertia tail advances only one authored action', async ({ browser }) => {
  async function resultingScroll(deltas: readonly number[]): Promise<number> {
    const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
    await page.locator('.pin-scene').nth(1).scrollIntoViewIfNeeded();
    for (const delta of deltas) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(2600);
    const result = await page.evaluate(() => scrollY);
    await page.close();
    return result;
  }

  const oneGesture = await resultingScroll([240]);
  const inertialGesture = await resultingScroll(
    Array.from({ length: 100 }, (_, index) => Math.max(3, Math.round(240 * Math.exp(-index / 12)))),
  );

  expect(inertialGesture).toBeCloseTo(oneGesture, 0);
});

test('deferred stage plates load when intersection observation is unavailable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-deferred="cow scene"]').waitFor({ state: 'attached' });
  await page.evaluate(() => Reflect.deleteProperty(window, 'IntersectionObserver'));

  const cow = page.locator('.pin-scene').nth(1);
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await expect.poll(() => cow.locator('image[href]').count()).toBeGreaterThan(0);
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
  for (let index = 0; index < 60; index++) {
    await page.mouse.wheel(0, Math.max(3, Math.round(400 * Math.exp(-index / 9))));
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(bounds.end);
  const cow = page.locator('.pin-scene').nth(1);
  const cowBox = await cow.boundingBox();
  expect(cowBox!.y + cowBox!.height).toBeLessThanOrEqual(1);
  const headingTop = await page.getByRole('heading', { name: 'Now, the spherical human' })
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(headingTop).toBeLessThan(900);
});

test('a reload deep in the essay returns the reader to the scene they were reading', async ({ page }) => {
  await page.setViewportSize({ width: 962, height: 527 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await loadDeferred(page, 'trade scene', page.locator('.room-stage'));
  await page.evaluate(() => {
    const room = document.querySelector('.room-stage')!;
    scrollTo(0, Math.round(room.getBoundingClientRect().top + scrollY + innerHeight * 2));
  });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => Math.round(scrollY));

  await page.reload({ waitUntil: 'domcontentloaded' });
  // Deferred scenes mount one after another, so the page reaches the remembered
  // place in steps rather than in one jump.
  await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 8_000 })
    .toBeGreaterThan(before - 120);
  await expect(page.locator('.room-stage').first()).toBeVisible();
});

test('a restore that has finished leaves the reader in control of the page', async ({ page }) => {
  await page.setViewportSize({ width: 962, height: 527 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await loadDeferred(page, 'cow scene', page.locator('.cast-stage'));
  await loadDeferred(page, 'trade scene', page.locator('.room-stage'));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.6));
  await page.waitForTimeout(500);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2_500);
  const restored = await page.evaluate(() => Math.round(scrollY));
  expect(restored).toBeGreaterThan(2_000);

  // Once the walk has let go, nothing pulls the page back to the saved place.
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(1_500);
  expect(await page.evaluate(() => Math.round(scrollY))).toBeLessThan(2_000);
});

test('a fragment left in the address bar does not drag the reader back on reload', async ({ page }) => {
  await page.setViewportSize({ width: 962, height: 527 });
  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_200);
  // ChapterIndex leaves #gini in the URL as the reader carries on past it.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.62));
  await page.waitForTimeout(700);
  const saved = await page.evaluate(() => sessionStorage.getItem('merit-or-math:reading-place:v1'));

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(async () => {
    const place = JSON.parse(saved!);
    return page.evaluate(({ id, offset }) => {
      const el = document.getElementById(id);
      if (!el) return -1;
      return Math.abs(scrollY - (el.getBoundingClientRect().top + scrollY + offset));
    }, place);
  }, { timeout: 8_000 }).toBeLessThan(80);

  // The reader's place survives the reload rather than being overwritten by it.
  expect(await page.evaluate(() => sessionStorage.getItem('merit-or-math:reading-place:v1'))).toBe(saved);
});

test('a hash link still wins over the remembered place', async ({ page }) => {
  await page.setViewportSize({ width: 962, height: 527 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => scrollTo(0, 6_000));
  await page.waitForTimeout(500);

  await page.goto('/#gini', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_500);
  const gap = await page.evaluate(() => {
    const el = document.getElementById('gini')!;
    return Math.abs(el.getBoundingClientRect().top);
  });
  expect(gap).toBeLessThan(140);
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

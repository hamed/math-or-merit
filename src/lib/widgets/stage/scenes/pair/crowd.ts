/**
 * Scene 2's crowd, as data (owner, 2026-09-26): during the title people bounce
 * in; coins pop out of MATH and fall, and the crowd moves and jumps to catch
 * them. One of them catches a lot, one catches very little — those two are
 * Blue and Red. Everyone else catches a coin or two, or none, and leaves with
 * what they caught.
 *
 * Seeded, so the scene is the same every time. Blue catches 15 and Red 1: the
 * sixteen coins of the game that follows.
 */
import { createRandomSource } from '$lib/sim';

export const CROWD = 16;
/** Becomes Red: catches the least of the two who stay; under MATH, second in reading order. */
export const SMALL = 11;
/** Becomes Blue: catches the most; under MERIT, first in reading order. */
export const BIG = 4;
/** What the two who stay end up holding: the game's sixteen coins. */
export const BLUE_CATCHES = 15;
export const RED_CATCHES = 1;

const SEED = 20260926;

/** What everyone else catches: a coin or two, or none. */
function othersCatches(): number[] {
  const random = createRandomSource(SEED);
  for (;;) {
    const counts = new Array<number>(CROWD).fill(0);
    for (let i = 0; i < CROWD; i++) {
      if (i === BIG || i === SMALL) continue;
      const draw = random.next();
      counts[i] = draw < 0.3 ? 0 : draw < 0.75 ? 1 : 2;
    }
    const zeros = counts.filter((c, i) => c === 0 && i !== BIG && i !== SMALL).length;
    if (zeros >= 3 && zeros <= 5) {
      counts[BIG] = BLUE_CATCHES;
      counts[SMALL] = RED_CATCHES;
      return counts;
    }
  }
}

/** What each person holds once every coin has landed. */
export const RAINED: readonly number[] = othersCatches();
/** How many coins fall. */
export const COINS = RAINED.reduce((sum, c) => sum + c, 0);

/**
 * Who catches each coin, in the order they fall: shuffled, so Blue's catches
 * come all through the rain and Red's one comes early.
 */
function rainOrder(): number[] {
  const random = createRandomSource(SEED + 1);
  const order: number[] = [];
  RAINED.forEach((count, who) => {
    if (who !== SMALL) for (let k = 0; k < count; k++) order.push(who);
  });
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.splice(2, 0, SMALL);
  return order;
}

export const RAIN: readonly number[] = rainOrder();

/** Seconds between one falling coin and the next, and one coin's fall. */
export const RAIN_GAP = 0.15;
export const FALL = 0.7;
/** How long the rain takes, seconds. */
export const RAIN_SECONDS = 0.2 + RAIN.length * RAIN_GAP + FALL + 0.3;

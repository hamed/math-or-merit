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

/** One drop from MATH: `count` coins falling together, and who ends up with them. */
export interface Drop {
  readonly who: number;
  readonly count: number;
}

/**
 * The rain, in the order it falls. Everyone else's coins fall one at a time;
 * Blue's come in bundles of two to four — he keeps turning up where the coins
 * come down thickest — and Red's one coin comes early.
 */
function drops(): Drop[] {
  const random = createRandomSource(SEED + 1);
  const out: Drop[] = [];
  let left = RAINED[BIG];
  while (left > 0) {
    const count = Math.min(left, 2 + Math.floor(random.next() * 3));
    out.push({ who: BIG, count });
    left -= count;
  }
  RAINED.forEach((count, who) => {
    if (who !== BIG && who !== SMALL) for (let k = 0; k < count; k++) out.push({ who, count: 1 });
  });
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  out.splice(1, 0, { who: SMALL, count: RED_CATCHES });
  return out;
}

export const DROPS: readonly Drop[] = drops();

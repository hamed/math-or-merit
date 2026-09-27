/**
 * Scene 2's crowd, as data (owner reviews 2026-09-26, 2026-09-27): during the
 * title people hop in, already different sizes, each a plain circle; the
 * whole title is the machine, and coins spill from every part of it. A coin
 * lands on whoever it lands on — and a bigger circle is a bigger target, so
 * the more you hold, the more you catch. One ends up big, one stays small:
 * those two are Blue and Red. Everyone else leaves with what they have.
 *
 * It is the rich-get-richer urn (Pólya's): every coin goes to a person with
 * odds in proportion to what they already hold. The seed is one whose draws
 * end with Blue at 15 and Red at 1 — the sixteen coins of the game that
 * follows — found by searching seeds (it is rare, which is the point of the
 * essay, not of this scene). Seeded, so the scene is the same every time.
 */
import { createRandomSource } from '$lib/sim';

export const CROWD = 16;
/** Becomes Red: stays small; under MATH, second in reading order. */
export const SMALL = 11;
/** Becomes Blue: grows big; under MERIT, first in reading order. */
export const BIG = 4;
/** What the two who stay end up holding: the game's sixteen coins. */
export const BLUE_CATCHES = 15;
export const RED_CATCHES = 1;

/** A seed whose urn ends with Blue at 15 and Red at 1 (scripts search: 73555 of the first few hundred thousand). */
const SEED = 73555;
/** How many coins spill from the title. */
const RAIN = 30;

/** One coin from the title, and who it lands on. */
export interface Drop {
  readonly who: number;
  readonly count: number;
}

function urn(): { start: number[]; drops: Drop[]; end: number[] } {
  const random = createRandomSource(SEED);
  const start = Array.from({ length: CROWD }, () => {
    const d = random.next();
    return d < 0.5 ? 1 : d < 0.85 ? 2 : 3;
  });
  const hold = [...start];
  let total = hold.reduce((sum, c) => sum + c, 0);
  const drops: Drop[] = [];
  for (let k = 0; k < RAIN; k++) {
    // a bigger circle is a bigger target: odds in proportion to what each holds
    let x = random.next() * total;
    let who = 0;
    while (x >= hold[who]) x -= hold[who++];
    hold[who] += 1;
    total += 1;
    drops.push({ who, count: 1 });
  }
  return { start, drops, end: hold };
}

const URN = urn();

/** What each person holds as they hop in: already different sizes. */
export const START: readonly number[] = URN.start;
/** What each person holds once every coin has landed. */
export const RAINED: readonly number[] = URN.end;
/** How many coins fall. */
export const COINS = RAIN;
/** The rain, in the order it falls: one coin at a time, each to whoever it lands on. */
export const DROPS: readonly Drop[] = URN.drops;

/**
 * Scene 2's crowd, authored but rule-shaped (brief, Scene 2).
 *
 * Sixteen people, one coin each — sixteen coins make one person's fortune, so
 * the whole crowd holds exactly one fortune. Then they bite. Every bite follows
 * the game's own rule: the stake is half of the SMALLER fortune, and the winner
 * takes it. The outcomes are chosen, as the three rounds of the game are — any
 * sequence of tosses is possible, and this is one — but no bite breaks the rule.
 *
 * A circle that reaches nothing is absorbed: once a bite leaves it below
 * ABSORB_BELOW, its crumb goes to whoever bit it. Nothing is created or lost.
 *
 * It ends with two: BIG with 15 and SMALL with 1. SMALL finishes on exactly the
 * coin it started with — it won one bite and later lost the same stake back —
 * and BIG holds everything else. Headless and exact: every amount is a sum of
 * halvings of 1, so floating point carries it without error.
 */

export const CROWD = 16;
/** Becomes Red: the small survivor, under MATH, second in the reading order. */
export const SMALL = 11;
/** Becomes Blue: the big survivor, under MERIT, first in the reading order. */
export const BIG = 4;
/** Below this a circle is "nothing" and is absorbed by its biter. */
export const ABSORB_BELOW = 0.13;

export interface Bite {
  readonly a: number;
  readonly b: number;
  readonly winner: number;
  readonly stake: number;
  /** Seconds from the start of the bites. */
  readonly at: number;
  /** Set when the loser was absorbed by this bite. */
  readonly absorbed: number | null;
  /** Everyone's wealth after this bite. */
  readonly after: readonly number[];
}

/** First gap, the speed-up per bite, and the fastest the bites ever come. */
const FIRST_GAP = 0.5;
const ACCELERATE = 0.9;
const FASTEST = 0.085;

type Move = readonly [winner: number, loser: number] | { readonly eat: readonly [winner: number, loser: number] };

/** The authored order. `eat` means: keep biting until the loser is absorbed. */
const SCRIPT: readonly Move[] = [
  // A: the crowd plays among itself. SMALL wins its one bite here.
  [2, 3],
  [SMALL, 5],
  [8, 7],
  [13, 14],
  [1, 0],
  [9, 10],
  [BIG, 12],
  // B: some consolidate before the big one reaches them.
  { eat: [2, 3] },
  { eat: [8, 7] },
  // C: BIG starts eating.
  { eat: [BIG, 12] },
  { eat: [BIG, 13] },
  { eat: [BIG, 14] },
  // SMALL gives its winnings back to someone still holding exactly one coin.
  [6, SMALL],
  { eat: [BIG, 5] },
  { eat: [BIG, 2] },
  { eat: [BIG, 8] },
  { eat: [BIG, 9] },
  { eat: [BIG, 10] },
  { eat: [BIG, 0] },
  { eat: [BIG, 1] },
  { eat: [BIG, 6] },
  { eat: [BIG, 15] },
];

export function crowdBites(): Bite[] {
  const wealth = new Array<number>(CROWD).fill(1);
  const bites: Bite[] = [];
  let at = 0;
  let gap = FIRST_GAP;

  const bite = (winner: number, loser: number): boolean => {
    if (wealth[winner] <= 0 || wealth[loser] <= 0) {
      throw new Error(`bite on an absorbed circle: ${winner}, ${loser}`);
    }
    const stake = Math.min(wealth[winner], wealth[loser]) / 2;
    wealth[winner] += stake;
    wealth[loser] -= stake;
    let absorbed: number | null = null;
    if (wealth[loser] < ABSORB_BELOW) {
      wealth[winner] += wealth[loser];
      wealth[loser] = 0;
      absorbed = loser;
    }
    bites.push({ a: winner, b: loser, winner, stake, at, absorbed, after: [...wealth] });
    at += gap;
    gap = Math.max(FASTEST, gap * ACCELERATE);
    return absorbed !== null;
  };

  for (const move of SCRIPT) {
    if ('eat' in move) {
      const [winner, loser] = move.eat;
      for (let guard = 0; guard < 64 && !bite(winner, loser); guard++);
    } else {
      bite(move[0], move[1]);
    }
  }
  return bites;
}

export const BITES: readonly Bite[] = crowdBites();

/** How long the bites take, seconds. */
export const BITES_SECONDS = BITES[BITES.length - 1].at + 0.4;

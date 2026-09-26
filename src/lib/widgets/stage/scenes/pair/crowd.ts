/**
 * Scene 2's crowd, as data (owner, 2026-09-26): people bounce in; sixteen
 * coins fall at random, so some catch one or two and some catch none; then
 * they bump into each other, and every bump is a trade by the game's own
 * rule — the stake is half of the SMALLER fortune, and the winner takes it.
 * One grows very big, one stays small; everyone else ends with nothing and
 * bounces out. Those two stay.
 *
 * The draws are seeded, so the scene is the same every time — any sequence of
 * tosses is possible, and this is one — but no bump breaks the rule. A fortune
 * that reaches nothing is emptied: once a bump leaves it below ABSORB_BELOW,
 * its crumb goes to whoever it lost to. Nothing is created or lost: the sixteen
 * coins end as Blue's 15 and Red's 1, exactly (every amount is a sum of
 * halvings of whole coins, which floating point carries without error).
 *
 * Red (SMALL) catches one coin and never bumps anyone: he is the one the
 * trading passed by. Blue (BIG) is the one it did not.
 */
import { createRandomSource } from '$lib/sim';

export const CROWD = 16;
/** Coins that fall — one person's whole fortune, as in the game (sixteen coins). */
export const COINS = 16;
/** Becomes Red: the small survivor, under MATH, second in the reading order. */
export const SMALL = 11;
/** Becomes Blue: the big survivor, under MERIT, first in the reading order. */
export const BIG = 4;
/** Below this a fortune is "nothing" and goes to whoever it lost to. */
export const ABSORB_BELOW = 0.13;

const SEED = 20260926;

export interface Bite {
  readonly a: number;
  readonly b: number;
  readonly winner: number;
  readonly stake: number;
  /** Seconds from the start of the bumps. */
  readonly at: number;
  /** Set when the loser was emptied by this bump. */
  readonly absorbed: number | null;
  /** Everyone's wealth after this bump. */
  readonly after: readonly number[];
}

/** First gap, the speed-up per bump, and the fastest the bumps ever come. */
const FIRST_GAP = 0.45;
const ACCELERATE = 0.88;
const FASTEST = 0.1;
/** Bumps among the crowd before Blue starts sweeping up. */
const MIXING = 9;

/**
 * Who each falling coin lands on, in the order they fall. Red catches exactly
 * one; Blue catches at least one; at least three people catch nothing.
 */
function rain(): number[] {
  const random = createRandomSource(SEED);
  for (;;) {
    const order: number[] = [];
    const slot = Math.floor(random.next() * COINS);
    for (let k = 0; k < COINS; k++) {
      if (k === slot) order.push(SMALL);
      else {
        let who = SMALL;
        while (who === SMALL) who = Math.floor(random.next() * CROWD);
        order.push(who);
      }
    }
    const counts = holdings(order);
    const none = counts.filter((c) => c === 0).length;
    if (counts[SMALL] === 1 && counts[BIG] >= 1 && none >= 3) return order;
  }
}

function holdings(order: readonly number[]): number[] {
  const counts = new Array<number>(CROWD).fill(0);
  for (const who of order) counts[who] += 1;
  return counts;
}

export const RAIN: readonly number[] = rain();
/** What each person holds once every coin has landed. */
export const RAINED: readonly number[] = holdings(RAIN);

export function crowdBites(): Bite[] {
  const random = createRandomSource(SEED + 1);
  const wealth = [...RAINED];
  const bites: Bite[] = [];
  let at = 0;
  let gap = FIRST_GAP;

  const bite = (winner: number, loser: number): boolean => {
    if (wealth[winner] <= 0 || wealth[loser] <= 0) throw new Error(`bump on an empty fortune: ${winner}, ${loser}`);
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

  const holders = (except: readonly number[] = []) =>
    wealth.map((w, i) => i).filter((i) => wealth[i] > 0 && i !== SMALL && !except.includes(i));
  const pickOne = (from: readonly number[]) => from[Math.floor(random.next() * from.length)];

  // A: the crowd trades among itself; a toss decides every bump. Blue is never
  // emptied here — any sequence of tosses is possible, and this is one.
  for (let k = 0; k < MIXING; k++) {
    const pool = holders();
    if (pool.length < 2) break;
    const a = pickOne(pool);
    const b = pickOne(pool.filter((i) => i !== a));
    let winner = random.next() < 0.5 ? a : b;
    const loser = winner === a ? b : a;
    if (loser === BIG && wealth[BIG] - Math.min(wealth[a], wealth[b]) / 2 < 1) winner = BIG;
    bite(winner, winner === a ? b : a);
  }

  // B: Blue sweeps up. Between his bumps the others still bump each other.
  for (;;) {
    const rest = holders([BIG]);
    if (rest.length === 0) break;
    if (rest.length >= 2 && random.next() < 0.35) {
      const a = pickOne(rest);
      const b = pickOne(rest.filter((i) => i !== a));
      const winner = random.next() < 0.5 ? a : b;
      bite(winner, winner === a ? b : a);
      continue;
    }
    const target = pickOne(rest);
    while (!bite(BIG, target));
  }
  return bites;
}

export const BITES: readonly Bite[] = crowdBites();

/** How long the bumps take, seconds. */
export const BITES_SECONDS = BITES[BITES.length - 1].at + 0.4;

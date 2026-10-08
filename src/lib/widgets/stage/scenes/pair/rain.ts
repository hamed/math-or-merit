/**
 * How the crowd moves in Scene 2: hopping in (`planArrival`), and while the
 * coins drop (owner reviews 2026-09-26, 2026-09-27, 2026-10-07): each coin
 * falls straight down from a foot of the
 * title, under the stage's one gravity, and lands on whoever is under it — a
 * bigger circle is a bigger target. The one it is meant for hops over, at their
 * own gait (hops.ts), until the coin's line falls inside them; now and then a
 * neighbour goes for it too and arrives a beat late. Pure and deterministic,
 * so the scene can play it AND settle to the exact places it ends in.
 */
import type { Point } from '../../../shared/layout';
import { DROPS, START } from './crowd';
import { CROSSING, arrival, fallTime, gait, hopsAlong, hopsBy, type Hop } from './hops';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A catch: the drop's owner hops from `from` to `spot`, and the coin, let go at the foot, meets them at `meet`. */
export interface Catch {
  readonly drop: number;
  readonly who: number;
  readonly count: number;
  readonly foot: Point;
  readonly meet: Point;
  readonly from: Point;
  readonly spot: Point;
  readonly hops: readonly Hop[];
  /** The coin lets go of the title, and lands. Seconds. */
  readonly release: number;
  readonly land: number;
}

/** Someone going for a coin that is not theirs: they hop part of the way, too late, and stop. */
export interface Chase {
  readonly who: number;
  readonly from: Point;
  readonly to: Point;
  readonly hops: readonly Hop[];
  readonly depart: number;
  readonly arrive: number;
}

export interface RainPlan {
  readonly catches: readonly Catch[];
  readonly chases: readonly Chase[];
  /** Where everyone stands once the last coin has landed. */
  readonly finals: readonly Point[];
  /** Seconds from the first coin to everyone standing still. */
  readonly seconds: number;
}

export interface RainSetup {
  readonly homes: readonly Point[];
  readonly band: Box;
  /** Where the coins drop from, in the order they drop: the title's feet (titleFeet.ts). */
  readonly feet: readonly Point[];
  /** A body's radius for a fortune of `coins`: area is wealth. */
  readonly radius: (coins: number) => number;
  /** The stage's gravity, px/s² (hops.ts `gravity`). */
  readonly g: number;
}

/** Seconds, at least, between one coin landing and the next: several are in the air at once. */
export const GAP = 0.18;
/** How far off a body's middle a coin may land on it, as a share of its radius: anywhere across its top. */
export const REACH = 0.8;
/**
 * At most this long, seconds: the first fall, each coin's catch — most of them
 * the big one's, a hop from foot to foot — and a moment to stand still.
 */
export const RAIN_SECONDS = 2.0 + DROPS.length * 0.26 + 1.6;

/** A fixed, well-mixed pseudo-random number in [0, 1) for a pair of integers. */
export function noise(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233 + 0.5) * 43758.5453;
  return x - Math.floor(x);
}

/** Seconds into Scene 2 by which everyone has hopped in and settled: the step that plays it lasts a little longer (script.ts). */
export const ARRIVE_SECONDS = 4.4;
/** Seconds by which the rest have hopped off and the two stand under their words, after the rain. */
export const GATHER_SECONDS = 3.2;

/**
 * Scene 2's arrival: everyone hops in from the nearer side at their own gait,
 * each leaving a moment after the last, and all home by `ARRIVE_SECONDS` —
 * on a wide stage they bound further rather than arrive late.
 */
export function planArrival(s: { entries: readonly Point[]; homes: readonly Point[]; radius: (coins: number) => number; g: number }): Hop[][] {
  const unit = s.radius(1);
  return s.homes.map((home, i) => hopsBy(s.entries[i], home, 0.1 + noise(i, 1) * 0.8, s.radius(START[i]), unit, s.g, ARRIVE_SECONDS, CROSSING));
}

/**
 * Which foot each coin drops from: every foot drops the same share — three
 * each for the 27 coins and nine feet (owner, 2026-10-07: "more coins") — and
 * who catches it is the urn's. Those who catch a few take the foot nearest
 * them, as many of its coins as they need: a stream onto one place, not a
 * chase. The one who catches most takes the rest, sweeping them from the end
 * nearer to them.
 */
function footsteps(s: RainSetup): Map<number, Point[]> {
  const count = new Map<number, number>();
  for (const d of DROPS) count.set(d.who, (count.get(d.who) ?? 0) + 1);
  const all = s.feet.length ? s.feet : [{ x: s.band.x + s.band.w / 2, y: s.band.y - s.band.h }];
  const left = all.map((_, i) => Math.floor(DROPS.length / all.length) + (i < DROPS.length % all.length ? 1 : 0));
  const queue = new Map<number, Point[]>();
  for (const who of [...count.keys()].sort((a, b) => count.get(a)! - count.get(b)!)) {
    const home = s.homes[who];
    const mine: Point[] = [];
    const near = all.map((_, i) => i).sort((a, b) => Math.abs(all[a].x - home.x) - Math.abs(all[b].x - home.x));
    for (const i of near)
      for (; left[i] > 0 && mine.length < count.get(who)!; left[i]--) mine.push(all[i]);
    // a sweep, from the end nearer home
    mine.sort((a, b) => a.x - b.x);
    if (Math.abs(mine[mine.length - 1].x - home.x) < Math.abs(mine[0].x - home.x)) mine.reverse();
    queue.set(who, mine);
  }
  return queue;
}

export function planRain(s: RainSetup): RainPlan {
  const { band, g } = s;
  const unit = s.radius(1);
  const inBand = (x: number) => Math.min(band.x + band.w, Math.max(band.x, x));
  const pos = s.homes.map((p) => ({ ...p }));
  const free = s.homes.map(() => 0);
  const held = [...START];
  const catches: Catch[] = [];
  const chases: Chase[] = [];
  let last = 0;
  const queue = footsteps(s);

  DROPS.forEach((drop, k) => {
    const who = drop.who;
    const ahead = queue.get(who)!;
    const foot = ahead.shift()!;
    const r = s.radius(held[who]);
    // stand so the coin's line falls across the top of the body, the least way over — and where the
    // next ones fall too, if the body is wide enough: a big body catches a stream without a step
    const from = { ...pos[who] };
    const reach = REACH * r;
    let lo = foot.x - reach;
    let hi = foot.x + reach;
    for (const next of ahead) {
      if (next.x - reach > hi || next.x + reach < lo) break;
      [lo, hi] = [Math.max(lo, next.x - reach), Math.min(hi, next.x + reach)];
    }
    const spot = { x: inBand(Math.min(hi, Math.max(lo, from.x))), y: from.y };
    const dx = foot.x - spot.x;
    const meet = { x: foot.x, y: spot.y - Math.sqrt(Math.max(0, r * r - dx * dx)) };
    const fall = fallTime(meet.y - foot.y, g);
    // in a hurry: bound, a whole move in as few hops as a stretched stride allows (hops.ts `stride`)
    const stride = 2.2;
    // the coin may meet them as they touch down, while they still settle: the blow lands on the squash
    const touch = (hops: readonly Hop[], at: number) => (hops.length ? hops[hops.length - 1].land : at);
    const travel = touch(hopsAlong(from, spot, 0, r, unit, g, 1, stride), 0);
    // land a beat after the last coin, once there; leave as late as that allows
    const want = Math.max(last + GAP, fall + 0.25);
    const depart = Math.max(free[who], want - 0.05 - travel);
    const hops = hopsAlong(from, spot, depart, r, unit, g, 1, stride);
    const land = Math.max(want, touch(hops, depart) + 0.05);
    catches.push({ drop: k, who, count: drop.count, foot, meet, from, spot, hops, release: land - fall, land });
    pos[who] = spot;
    // free once settled from the hop and the blow
    free[who] = Math.max(land + 0.15, arrival(hops, depart));
    held[who] += drop.count;
    last = land;

    // every other coin, the nearest one who is free goes for it too, and arrives a beat late
    if (k % 2 === 1) {
      let rival = -1;
      let best = Infinity;
      pos.forEach((p, i) => {
        const d = Math.hypot(p.x - spot.x, p.y - spot.y);
        if (i !== who && d < best && free[i] < land - 0.8) [rival, best] = [i, d];
      });
      if (rival >= 0) {
        const rr = s.radius(held[rival]);
        if (best < 3 * gait(rr, unit, g).length && best > rr + r) {
          const start = { ...pos[rival] };
          const to = { x: inBand(start.x + (spot.x - start.x) * 0.55), y: start.y };
          const span = arrival(hopsAlong(start, to, 0, rr, unit, g), 0);
          const leave = land + 0.1 - span;
          if (leave >= free[rival] && span > 0) {
            const run = hopsAlong(start, to, leave, rr, unit, g);
            const arrive = arrival(run, leave);
            chases.push({ who: rival, from: start, to, hops: run, depart: leave, arrive });
            pos[rival] = to;
            free[rival] = arrive + 0.2;
          }
        }
      }
    }
  });

  const seconds = Math.max(...catches.map((c) => c.land), ...chases.map((c) => c.arrive)) + 0.6;
  return { catches, chases, finals: pos, seconds };
}

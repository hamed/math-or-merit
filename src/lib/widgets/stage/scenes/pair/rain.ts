/**
 * How the crowd moves while the coins rain (owner reviews 2026-09-26,
 * 2026-09-27): a coin lands on whoever it lands on — a bigger circle is a
 * bigger target, so nobody has to run for it: the one it lands on shifts a
 * little under it and bumps up to meet it. The one or two nearest scramble
 * for it anyway, arrive a beat late, and stop. Pure and deterministic, so the
 * scene can play it AND settle to the exact places it ends in.
 */
import type { Point } from '../../../shared/layout';
import { DROPS } from './crowd';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A catch: the drop's owner hops from `from` to `spot`, leaving at `depart`, and meets the coins at `land`. */
export interface Catch {
  readonly drop: number;
  readonly who: number;
  readonly count: number;
  readonly from: Point;
  readonly spot: Point;
  readonly depart: number;
  readonly land: number;
}

/** Someone going for a drop that is not theirs: they hop part of the way and stop. */
export interface Chase {
  readonly who: number;
  readonly from: Point;
  readonly to: Point;
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

/** One small hop, seconds; and the seconds between one drop and the next. */
export const HOP_SECONDS = 0.26;
export const DROP_GAP = 0.16;
/** How long a coin takes to fall from MATH. */
export const FALL = 0.7;

/** A fixed, well-mixed pseudo-random number in [0, 1) for a pair of integers. */
export function noise(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233 + 0.5) * 43758.5453;
  return x - Math.floor(x);
}

export function hopsFor(distance: number, hopLength: number): number {
  return distance < 1 ? 0 : Math.max(1, Math.ceil(distance / hopLength));
}

export function planRain(homes: readonly Point[], band: Box, one: number): RainPlan {
  const inside = (p: Point): Point => ({
    x: Math.min(band.x + band.w, Math.max(band.x, p.x)),
    y: Math.min(band.y + band.h, Math.max(band.y, p.y)),
  });
  const hop = one * 2.2;
  const pos = homes.map((p) => ({ ...p }));
  const busy = homes.map(() => 0);
  const catches: Catch[] = [];
  const chases: Chase[] = [];

  DROPS.forEach((drop, k) => {
    const who = drop.who;
    const from = pos[who];
    // the coin comes to its target where it stands: nobody runs for their own coin
    const spot = inside({ ...from });
    const travel = hopsFor(Math.hypot(spot.x - from.x, spot.y - from.y), hop) * HOP_SECONDS;
    const base = 0.4 + k * DROP_GAP + FALL;
    const depart = Math.max(busy[who], base - travel - 0.05);
    const land = depart + travel + 0.05;
    catches.push({ drop: k, who, count: drop.count, from: { ...from }, spot, depart, land });
    pos[who] = spot;
    busy[who] = land + 0.08;

    // the nearest one or two go for it as well, and arrive a beat late
    const rivals = pos
      .map((p, i) => ({ i, d: Math.hypot(p.x - spot.x, p.y - spot.y) }))
      .filter(({ i, d }) => i !== who && d < one * 9 && busy[i] < land - 0.5)
      .sort((a, b) => a.d - b.d)
      .slice(0, 1 + (noise(k, 4) < 0.5 ? 1 : 0));
    for (const { i } of rivals) {
      const start = pos[i];
      const share = 0.5 + noise(k, 10 + i) * 0.3;
      const to = inside({ x: start.x + (spot.x - start.x) * share, y: start.y + (spot.y - start.y) * share });
      const hops = hopsFor(Math.hypot(to.x - start.x, to.y - start.y), hop);
      const arrive = land + 0.08 + noise(k, 20 + i) * 0.18;
      const leave = arrive - hops * HOP_SECONDS;
      if (leave < busy[i] || hops === 0) continue;
      chases.push({ who: i, from: { ...start }, to, depart: leave, arrive });
      pos[i] = to;
      busy[i] = arrive + 0.2;
    }
  });

  const seconds = Math.max(...catches.map((c) => c.land), ...chases.map((c) => c.arrive)) + 0.5;
  return { catches, chases, finals: pos, seconds };
}

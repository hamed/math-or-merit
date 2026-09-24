/**
 * Where everything stands on the pair stage, for a stage of any size. Pure.
 *
 * Sides are PHYSICAL in every locale (ADR-006 amendment): Red and MATH on the
 * left, Blue and MERIT on the right. Everything here is in stage pixels.
 */
import { roomPositions, radiusScale, type Point } from '../../../shared/layout';
import { UNITS } from './game';
import { CROWD } from './crowd';

export interface PairLayout {
  readonly width: number;
  readonly height: number;
  /** Radius of one whole fortune — all sixteen coins. */
  readonly whole: number;
  /** A fortune of `coins`, drawn true to area. */
  radius(coins: number): number;
  /** The smallest a protagonist is ever drawn, so neither vanishes when poor (4.2). */
  readonly minRadius: number;
  /** Under MATH (Red) and under MERIT (Blue), Scenes 2–7. */
  readonly markRed: Point;
  readonly markBlue: Point;
  /** Where the two sit to play, Scenes 8–13. */
  readonly seatRed: Point;
  readonly seatBlue: Point;
  readonly table: Point;
  readonly flip: Point;
  /** Where each of the sixteen stands before the bites. */
  readonly crowdHomes: readonly Point[];
  readonly ground: number;
  /** One coin's radius: money is one size everywhere. */
  readonly coinRadius: number;
  /** The room of Scene 14: positions, everyone's radius, and the pair's seats in it. */
  readonly room: {
    readonly positions: readonly Point[];
    readonly radius: number;
    readonly red: number;
    readonly blue: number;
  };
}

export function pairLayout(width: number, height: number, roomSize = 100): PairLayout {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const portrait = h > w;
  const whole = Math.min(150, Math.max(46, Math.min(w, h) * (portrait ? 0.2 : 0.15)));
  const radius = (coins: number) => whole * Math.sqrt(Math.max(0, coins) / UNITS);

  const ground = h * 0.9;
  const one = radius(1);
  // Sixteen across if they fit two diameters apart, otherwise balanced rows —
  // 8 and 8, never 12 and a lonely 4 (the room's own rule, owner review 2026-07-13).
  const fit = Math.min(CROWD, Math.max(4, Math.floor((w * 0.86) / (one * 2.6))));
  const rows = Math.ceil(CROWD / fit);
  const crowdHomes: Point[] = [];
  for (let row = 0; row < rows; row++) {
    const first = Math.round((row * CROWD) / rows);
    const inRow = Math.round(((row + 1) * CROWD) / rows) - first;
    for (let col = 0; col < inRow; col++) {
      // alternate rows offset by half a slot, so the crowd reads as a crowd, not a grid
      const x = w * 0.07 + ((col + 0.5 + (row % 2) * 0.35) / (inRow + 0.35 * (rows > 1 ? 1 : 0))) * w * 0.86;
      crowdHomes.push({ x, y: ground - one - row * one * 2.8 });
    }
  }

  const markY = portrait ? h * 0.6 : h * 0.62;
  const seatY = portrait ? h * 0.5 : h * 0.48;
  const left = portrait ? 0.3 : 0.33;

  // the bottom of the stage is kept clear for the choice that ends Scene 14
  const roomBox = { x: w * 0.06, y: h * 0.12, w: w * 0.88, h: h * 0.72 };
  const positions = roomPositions(roomSize, roomBox.w, roomBox.h).map((p) => ({
    x: p.x + roomBox.x,
    y: p.y + roomBox.y,
  }));
  const nearest = (target: Point) =>
    positions.reduce((best, p, i) => (Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(positions[best].x - target.x, positions[best].y - target.y) ? i : best), 0);
  const seatRed = { x: w * left, y: seatY };
  const seatBlue = { x: w * (1 - left), y: seatY };

  return {
    width: w,
    height: h,
    whole,
    radius,
    minRadius: Math.max(9, whole * 0.12),
    markRed: { x: w * left, y: markY },
    markBlue: { x: w * (1 - left), y: markY },
    seatRed,
    seatBlue,
    table: { x: w * 0.5, y: seatY + whole * 1.05 },
    flip: { x: w * 0.5, y: seatY - whole * 1.1 },
    crowdHomes,
    ground,
    coinRadius: whole / Math.sqrt(UNITS),
    room: {
      positions,
      radius: radiusScale(roomSize, roomBox.w, roomBox.h) * Math.sqrt(1 / roomSize),
      red: nearest(seatRed),
      blue: nearest(seatBlue),
    },
  };
}

/**
 * Where `count` coins sit inside a fortune of radius `fit`: the nearest points
 * of a honeycomb to the centre, so the pile is round, then scaled down just
 * enough to sit inside the circle. Coins are one size for money everywhere, so
 * the scale only ever shrinks a crowded pile, never grows a sparse one.
 */
export function lattice(count: number, coinRadius: number, fit = Infinity): { spots: Point[]; r: number } {
  if (count <= 0) return { spots: [], r: coinRadius };
  const step = coinRadius * 2;
  const rowH = coinRadius * Math.sqrt(3);
  const reach = Math.ceil(Math.sqrt(count)) + 2;
  const points: Point[] = [];
  for (let row = -reach; row <= reach; row++) {
    const offset = (row & 1) * coinRadius;
    for (let col = -reach; col <= reach; col++) points.push({ x: col * step + offset, y: row * rowH });
  }
  // nearest first; ties broken by angle so the pile is the same every time
  points.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) || Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const chosen = points.slice(0, count);
  const cx = chosen.reduce((sum, p) => sum + p.x, 0) / count;
  const cy = chosen.reduce((sum, p) => sum + p.y, 0) / count;
  const centred = chosen.map((p) => ({ x: p.x - cx, y: p.y - cy }));
  const extent = Math.max(...centred.map((p) => Math.hypot(p.x, p.y))) + coinRadius;
  const scale = Math.min(1, (fit * 0.96) / extent);
  return { spots: centred.map((p) => ({ x: p.x * scale, y: p.y * scale })), r: coinRadius * scale };
}

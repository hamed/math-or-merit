/**
 * Where everything stands on the pair stage, for a stage of any size. Pure.
 *
 * Blue stands under MERIT, which the title says first; Red under MATH, second
 * (owner, 2026-09-26). "First" is the reading direction's start, so in a
 * right-to-left locale the whole stage mirrors like everything else (ADR-006;
 * the v3 physical-sides amendment is withdrawn). Everything here is in stage
 * pixels.
 */
import { roomPositions, radiusScale, type Point } from '../../../shared/layout';
import { UNITS } from './game';
import { CROWD } from './crowd';
import { PACKINGS } from './packings';

/**
 * How much of a fortune's circle its coins cover. Every coin claims the same
 * area, a little more than itself, so a circle's area is exactly its coins'
 * area. At this density eight coins — the two made equal — and fifteen — Blue
 * at the start — sit in their circles as tight as coins can pack.
 */
export const COIN_DENSITY = 0.7325;

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
  /** The room of Scene 10: positions, everyone's radius, and the pair's seats in it. */
  readonly room: {
    /** The room's top edge: the talk stays above it. */
    readonly top: number;
    readonly positions: readonly Point[];
    readonly radius: number;
    readonly red: number;
    readonly blue: number;
  };
}

export function pairLayout(width: number, height: number, roomSize = 100, mirror = false): PairLayout {
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

  // low on the stage: the talk needs the room above them (iteration 2, 3.1)
  const markY = portrait ? h * 0.66 : h * 0.68;
  const seatY = portrait ? h * 0.66 : h * 0.64;
  const left = portrait ? 0.3 : 0.33;

  // the crowd keeps to the lower part, leaving room above for the talk (3.6)
  const roomBox = { x: w * 0.05, y: h * 0.38, w: w * 0.9, h: h * 0.58 };
  const positions = roomPositions(roomSize, roomBox.w, roomBox.h).map((p) => ({
    x: p.x + roomBox.x,
    y: p.y + roomBox.y,
  }));
  const nearest = (among: readonly Point[], target: Point) =>
    among.reduce((best, p, i) => (Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(among[best].x - target.x, among[best].y - target.y) ? i : best), 0);
  // MERIT and Blue at the start of the line, MATH and Red at its end
  const flipX = (p: Point): Point => (mirror ? { x: w - p.x, y: p.y } : p);
  const seatBlue = flipX({ x: w * left, y: seatY });
  const seatRed = flipX({ x: w * (1 - left), y: seatY });
  const homes = crowdHomes.map(flipX);
  const room = positions.map(flipX);

  return {
    width: w,
    height: h,
    whole,
    radius,
    minRadius: Math.max(9, whole * 0.12),
    markBlue: flipX({ x: w * left, y: markY }),
    markRed: flipX({ x: w * (1 - left), y: markY }),
    seatRed,
    seatBlue,
    table: { x: w * 0.5, y: seatY + whole * 1.05 },
    // between the two where there is room; under the table on a narrow screen,
    // where anything above them is where they talk
    flip: { x: w * 0.5, y: portrait ? seatY + whole * 1.95 : seatY },
    crowdHomes: homes,
    ground,
    coinRadius: whole * Math.sqrt(COIN_DENSITY / UNITS),
    room: {
      top: roomBox.y,
      positions: room,
      radius: radiusScale(roomSize, roomBox.w, roomBox.h) * Math.sqrt(1 / roomSize),
      red: nearest(room, seatRed),
      blue: nearest(room, seatBlue),
    },
  };
}

/**
 * Where `count` coins sit inside a fortune of radius `fit`: the tightest known
 * pile for that count (packings.ts). Coins are one size for money everywhere,
 * so the pile is never scaled up or down — only its centres draw in when the
 * circle is a touch smaller than the packing (two to six coins, where no
 * packing reaches the fixed density), and then the coins overlap like a small
 * pile on a table. Counts past the table fall back to a honeycomb.
 */
export function pile(count: number, coinRadius: number, fit: number): Point[] {
  if (count <= 0) return [];
  const packing = PACKINGS[count - 1];
  if (!packing) return honeycomb(count, coinRadius);
  const reach = packing.radius - 1;
  const room = fit / coinRadius - 1;
  const draw = reach > 0 ? Math.min(1, Math.max(0, room) / reach) : 1;
  return packing.centres.map(([x, y]) => ({ x: x * coinRadius * draw, y: y * coinRadius * draw }));
}

/** The nearest points of a honeycomb to the centre, for a count no packing covers. */
function honeycomb(count: number, coinRadius: number): Point[] {
  const step = coinRadius * 2;
  const rowH = coinRadius * Math.sqrt(3);
  const reach = Math.ceil(Math.sqrt(count)) + 2;
  const points: Point[] = [];
  for (let row = -reach; row <= reach; row++) {
    const offset = (row & 1) * coinRadius;
    for (let col = -reach; col <= reach; col++) points.push({ x: col * step + offset, y: row * rowH });
  }
  points.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) || Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  return points.slice(0, count);
}

/**
 * The decider's face and apparent width at a turn of `angle` radians. Marx is
 * Red's side and faces up at 0; the bank is Blue's and faces up at π. A face
 * only ever changes where the coin is edge-on (|cos| = 0) — never mid-face
 * (iteration-2 brief 3.5).
 */
export function deciderFace(angle: number): { side: 'red' | 'blue'; squash: number } {
  const half = Math.floor((angle + Math.PI / 2) / Math.PI);
  return { side: half % 2 === 0 ? 'red' : 'blue', squash: Math.max(0.04, Math.abs(Math.cos(angle))) };
}

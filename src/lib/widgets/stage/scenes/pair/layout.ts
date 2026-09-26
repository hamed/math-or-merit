/**
 * Where everything stands on the pair stage, for a stage of any size. Pure.
 *
 * Blue stands under MERIT, which the title says first; Red under MATH, second
 * (owner, 2026-09-26). "First" is the reading direction's start, so in a
 * right-to-left locale the whole stage mirrors like everything else (ADR-006;
 * the v3 physical-sides amendment is withdrawn). Everything here is in stage
 * pixels.
 */
import { radiusScale, type Point } from '../../../shared/layout';
import { UNITS } from './game';
import { CROWD } from './crowd';
import { PACKINGS } from './packings';
import { createRandomSource } from '$lib/sim';

/**
 * How much of a fortune's circle its coins cover. Every coin claims the same
 * area, a little more than itself, so a circle's area is exactly its coins'
 * area. At this density eight coins — the two made equal — and fifteen — Blue
 * at the start — sit in their circles as tight as coins can pack.
 */
export const COIN_DENSITY = 0.7325;

/** How far the camera pulls back when the room fills (Scene 10): the pair's spacing shrinks by this. */
export const ROOM_ZOOM = 0.5;

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
  /** Where each of the sixteen stands once they have bounced in: scattered, never in rows. */
  readonly crowdHomes: readonly Point[];
  /** Where each of them comes in from, off the stage, and where each leaves to. */
  readonly crowdEntries: readonly Point[];
  readonly crowdExits: readonly Point[];
  /** The size of someone with nothing: visible, but no area (drawn as an empty ring). */
  readonly presence: number;
  /** Where the crowd stands and scrambles, under the title. */
  readonly crowdBand: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly ground: number;
  /** One coin's radius: money is one size everywhere. */
  readonly coinRadius: number;
  /** The charts' own column on a wide stage (Scenes 13–18); none on a narrow one. */
  readonly column: { readonly x: number; readonly y: number; readonly w: number; readonly h: number } | null;
  /** The room of Scene 10: positions, everyone's radius, and the pair's seats in it. */
  readonly room: {
    /** The room's top edge. */
    readonly top: number;
    /** The room's whole box: where the concept acts draw their pictures. */
    readonly box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
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
  // the lower part of the stage, under the title; scattered at random, no rows
  const band = { x: w * 0.06, y: h * 0.6, w: w * 0.88, h: h * 0.3 };
  const crowdHomes = scatter(CROWD, band, one * 2.7, 7);
  // everyone comes in from the nearer side, on the ground — nobody drops in from the sky
  const crowdEntries = crowdHomes.map((home) => ({ x: home.x < w / 2 ? -one * 2 : w + one * 2, y: home.y }));
  const crowdExits = crowdHomes.map((home) => ({ x: home.x < w / 2 ? -one * 4 : w + one * 4, y: home.y }));

  // low on the stage: the talk needs the room above them (iteration 2, 3.1)
  const markY = portrait ? h * 0.66 : h * 0.68;
  const seatY = portrait ? h * 0.66 : h * 0.64;
  const left = portrait ? 0.3 : 0.33;

  // On a wide stage the room takes the left three quarters, from near the top
  // down (owner review 2026-09-26: "use the free space at top for the room"),
  // and the charts get a column of their own on the right, big enough to read.
  // On a narrow one the room is the lower two thirds and the charts are thumbnails.
  const wide = w >= 900 && w > h * 1.15;
  const column = wide ? { x: w * 0.755, y: h * 0.1, w: w * 0.228, h: h * 0.87 } : null;
  const roomBox = wide ? { x: w * 0.03, y: h * 0.13, w: w * 0.7, h: h * 0.83 } : { x: w * 0.04, y: h * 0.3, w: w * 0.92, h: h * 0.66 };
  const roomRadius = radiusScale(roomSize, roomBox.w, roomBox.h) * Math.sqrt(1 / roomSize);
  // The camera pulls back about the middle as the room fills: the two keep
  // their places relative to each other, and everyone else scatters around.
  const middle = roomBox.x + roomBox.w / 2;
  const zoomed = (seat: Point): Point => ({ x: middle + (seat.x - w / 2) * ROOM_ZOOM, y: roomBox.y + roomBox.h * 0.55 });
  const pairInRoom = [zoomed({ x: w * left, y: 0 }), zoomed({ x: w * (1 - left), y: 0 })];
  const cell = Math.sqrt((roomBox.w * roomBox.h) / roomSize);
  const inset = roomRadius * 1.6;
  const others = scatter(
    Math.max(0, roomSize - 2),
    { x: roomBox.x + inset, y: roomBox.y + inset, w: roomBox.w - 2 * inset, h: roomBox.h - 2 * inset },
    cell * 0.8,
    11,
    pairInRoom.map((p) => ({ ...p, r: roomRadius * 1.4 })),
  );
  const positions = [...others, ...pairInRoom];
  // MERIT and Blue at the start of the line, MATH and Red at its end
  const flipX = (p: Point): Point => (mirror ? { x: w - p.x, y: p.y } : p);
  const seatBlue = flipX({ x: w * left, y: seatY });
  const seatRed = flipX({ x: w * (1 - left), y: seatY });
  const homes = crowdHomes.map(flipX);
  const room = positions.map(flipX);
  const blueSeatInRoom = positions.length - 2;

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
    crowdEntries: crowdEntries.map(flipX),
    crowdExits: crowdExits.map(flipX),
    presence: one * 0.55,
    crowdBand: band,
    ground,
    coinRadius: whole * Math.sqrt(COIN_DENSITY / UNITS),
    column: column && mirror ? { ...column, x: w - column.x - column.w } : column,
    room: {
      top: roomBox.y,
      box: mirror ? { ...roomBox, x: w - roomBox.x - roomBox.w } : roomBox,
      positions: room,
      radius: roomRadius,
      blue: blueSeatInRoom,
      red: blueSeatInRoom + 1,
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

/**
 * `count` points scattered at random in a box, no two closer than `gap` —
 * seeded, so the same every time, and with no rows or columns to read into it
 * (iteration-2 brief 3.6: the visible patterns were "aliasing"). Dart
 * throwing; a box too small for the gap gets a slightly smaller gap rather
 * than fewer points.
 */
export function scatter(
  count: number,
  box: { x: number; y: number; w: number; h: number },
  gap: number,
  seed: number,
  avoid: readonly { x: number; y: number; r: number }[] = [],
): Point[] {
  const random = createRandomSource(seed);
  const points: Point[] = [];
  let spacing = gap;
  let misses = 0;
  while (points.length < count) {
    const p = { x: box.x + random.next() * box.w, y: box.y + random.next() * box.h };
    const clear =
      points.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= spacing) &&
      avoid.every((a) => Math.hypot(p.x - a.x, p.y - a.y) >= spacing / 2 + a.r);
    if (clear) {
      points.push(p);
      misses = 0;
    } else if (++misses > 400) {
      spacing *= 0.94;
      misses = 0;
    }
  }
  return points;
}

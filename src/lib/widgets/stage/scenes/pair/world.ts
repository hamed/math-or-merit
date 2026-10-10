/**
 * The ending's world (owner, 2026-10-10): three boxes of the same 25 people —
 * one owner and crumbs, everyone equal, and between them the room the dial
 * makes. No room runs on screen: each stop of the dial is one finished room,
 * seeded, the same every time, so a levy always shows the same world and wears
 * the same colour — pure Blue's at no levy, pure Red's where the levy
 * saturates, violet between. The reader's choice travels as a link.
 *
 * Headless: no DOM, no Svelte.
 */
import { FILLS, STROKES } from '../../../shared/agentStyle';
import { record } from './recording';

/** How many people each box holds: few enough to fit a square, and to see. */
export const VEIL_N = 25;
/** The room's stake: the one the reader has watched all along. */
export const VEIL_STAKE = 0.1;
/** Trades in each finished room: enough that the levy's outcome has settled (and no levy has nearly one owner). */
export const VEIL_TRADES = 120_000;
const VEIL_SEED = 20261010;

/**
 * The levy's stops, once a round, at that stake. Its effect is relative to the
 * stake; past about a tenth it saturates (measured, 25 people: 0 → about 1.5
 * still count, 1% → 17, 10% → 24 of 25), so the dial ends there.
 */
export const VEIL_STOPS: readonly number[] = [0, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1];

/** The stop nearest a levy. */
export function snapLevy(levy: number): number {
  let best = VEIL_STOPS[0];
  for (const s of VEIL_STOPS) if (Math.abs(s - levy) < Math.abs(best - levy)) best = s;
  return best;
}

/** How far along the dial a levy stands: 0 at no levy, 1 at the last stop. */
export const levyShade = (levy: number): number => VEIL_STOPS.indexOf(snapLevy(levy)) / (VEIL_STOPS.length - 1);

// ---- the room at each stop ----------------------------------------------------

const made = new Map<number, Float64Array>();

/** Everyone's share in the finished room at a levy: one seeded room, the same every time. */
export function outcome(levy: number): Float64Array {
  const at = snapLevy(levy);
  let w = made.get(at);
  if (!w) {
    const r = record({ n: VEIL_N, beta: VEIL_STAKE, stop: { kind: 'trades', trades: VEIL_TRADES }, cap: VEIL_TRADES, levy: at }, VEIL_SEED);
    w = Float64Array.from(r.frames[r.frames.length - 1]);
    made.set(at, w);
  }
  return w;
}

/** The left box: the limit with no levy — one owner holds nearly all of it, a few crumbs for the rest. */
export const KEEPERS: readonly number[] = (() => {
  const giant = Math.floor(VEIL_N / 2);
  const crumbs = Array.from({ length: VEIL_N }, (_, i) => (i === giant ? 0 : 0.2 + hash(i, 3)));
  const sum = crumbs.reduce((t, c) => t + c, 0);
  return crumbs.map((c, i) => (i === giant ? 0.94 : (0.06 * c) / sum));
})();

/** The right box: the limit with everything shared back, every round — everyone equal. */
export const SHARERS: readonly number[] = Array.from({ length: VEIL_N }, () => 1 / VEIL_N);

// ---- where they stand: scattered, hardly touching -------------------------------

function hash(i: number, salt: number): number {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Circles of `radii` scattered in a square of side `size`: each starts near its
 * own seat (a jittered grid, the same for every box), then they push apart
 * until they hardly overlap and stay inside. Deterministic, so a person keeps
 * roughly their seat as the dial moves.
 */
export function scatter(radii: readonly number[], size: number): { x: number; y: number }[] {
  const n = radii.length;
  const side = Math.ceil(Math.sqrt(n));
  const cell = size / side;
  const seat = radii.map((_, i) => ({
    x: ((i % side) + 0.5 + (hash(i, 1) - 0.5) * 0.5) * cell,
    y: (Math.floor(i / side) + 0.5 + (hash(i, 2) - 0.5) * 0.5) * cell,
  }));
  const p = seat.map((s) => ({ ...s }));
  const gap = size * 0.012;
  for (let step = 0; step < 240; step++) {
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = p[j].x - p[i].x;
        const dy = p[j].y - p[i].y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const need = radii[i] + radii[j] + gap;
        if (d >= need) continue;
        // the smaller one moves more: a giant hardly budges for a crumb
        const push = need - d;
        const wi = radii[j] / (radii[i] + radii[j] || 1);
        p[i].x -= (dx / d) * push * wi;
        p[i].y -= (dy / d) * push * wi;
        p[j].x += (dx / d) * push * (1 - wi);
        p[j].y += (dy / d) * push * (1 - wi);
      }
    for (let i = 0; i < n; i++) {
      // a gentle pull back to the seat, and never outside
      p[i].x += (seat[i].x - p[i].x) * 0.01;
      p[i].y += (seat[i].y - p[i].y) * 0.01;
      const r = Math.min(radii[i], size / 2);
      p[i].x = Math.min(Math.max(p[i].x, r), size - r);
      p[i].y = Math.min(Math.max(p[i].y, r), size - r);
    }
  }
  return p;
}

// ---- the colour: OKLab, through three tokens -----------------------------------

type Lab = readonly [number, number, number];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function toHex([L, A, B]: Lab): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, gam(c))) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function ramp(stops: readonly string[], t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const k = Math.min(stops.length - 2, Math.floor(x));
  const [a, b] = [toOklab(stops[k]), toOklab(stops[k + 1])];
  const f = x - k;
  return toHex([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
}

const FILL_RAMP = [FILLS.blue, FILLS.violet, FILLS.red];
const STROKE_RAMP = [STROKES.blue, STROKES.violet, STROKES.red];

/** The colour `t` of the way from Blue's (0) through violet to Red's (1). */
export function shadeColour(t: number): { fill: string; stroke: string } {
  return { fill: ramp(FILL_RAMP, t), stroke: ramp(STROKE_RAMP, t) };
}

/** A levy's colour, the same every time: the world's signature. */
export const worldColour = (levy: number) => shadeColour(levyShade(levy));

// ---- the link: `?world=0.01` ----------------------------------------------------

export const WORLD_PARAM = 'world';

/** The page's address with the reader's world on it, everything else kept. */
export function worldLink(href: string, levy: number): string {
  const url = new URL(href);
  url.hash = '';
  url.searchParams.set(WORLD_PARAM, String(snapLevy(levy)));
  return url.toString();
}

/** The world a link carries, snapped to a stop; null when it carries none, or nonsense. */
export function parseWorld(search: string): number | null {
  const raw = new URLSearchParams(search).get(WORLD_PARAM);
  if (raw === null || raw.trim() === '') return null;
  const levy = Number(raw);
  if (!Number.isFinite(levy) || levy < 0 || levy > 1) return null;
  return snapLevy(levy);
}

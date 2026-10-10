/**
 * The ending's world (owner, 2026-10-10): one dial, the levy, from nothing to
 * everything; the room wears one colour, from Blue's through violet to Red's,
 * as more of it still counts; and the reader's choice travels as a link, so a
 * friend lands on the same world with nothing stored anywhere.
 *
 * Headless: no DOM, no Svelte. The colour a shared link shows comes from the
 * levy alone (the measured table), so the same levy is always the same colour.
 */
import { FILLS, STROKES } from '../../../shared/agentStyle';
import { VEIL_COUNTS } from './veilCounts';

/**
 * The levy's stops, once a round at the room's stake: nothing, then a
 * multiplying ladder to everything. The middle stop (1%) leaves a lively room:
 * fortunes differ and still change hands.
 */
export const VEIL_STOPS: readonly number[] = [0, 0.0003, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1];

/** The stop nearest a levy. */
export function snapLevy(levy: number): number {
  let best = VEIL_STOPS[0];
  for (const s of VEIL_STOPS) if (Math.abs(s - levy) < Math.abs(best - levy)) best = s;
  return best;
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

/** How far along from one owner (Blue's colour) to everyone equal (Red's): 0–1, for `count` of `n` still counting. */
export const shade = (count: number, n = 100): number => Math.min(1, Math.max(0, (count - 1) / (n - 1)));

/** The room's one colour when `count` of `n` still count. */
export function veilColour(count: number, n = 100): { fill: string; stroke: string } {
  const t = shade(count, n);
  return { fill: ramp(FILL_RAMP, t), stroke: ramp(STROKE_RAMP, t) };
}

/** How many still count at a levy, as measured (veilCounts.ts): between stops, read along the ladder. */
export function expectedCount(levy: number): number {
  const at = VEIL_STOPS.indexOf(snapLevy(levy));
  return VEIL_COUNTS[at];
}

/** A levy's colour, the same every time: what a shared link shows. */
export const worldColour = (levy: number) => veilColour(expectedCount(levy));

// ---- the link: `?world=0.003` ----------------------------------------------------

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

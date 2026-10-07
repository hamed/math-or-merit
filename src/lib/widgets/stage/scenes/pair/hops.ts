/**
 * Hops under one gravity (owner, 2026-10-07: "they move according to the
 * scaling law … physics should work here, motion under the usual g").
 *
 * A body of radius r hops about half its radius high and one and a half radii
 * far, and every flight is a parabola under the same g. Small bodies hop
 * often and short; big ones rarely and long: flight time grows as √r, so the
 * hop rate falls as r^−½ — wealth^−¼, the allometric slope of heart and breath
 * (face.ts `tempoOf`). Small bodies are hard and big ones soft: the crouch,
 * the squash and the settle all grow with size, and every squash keeps the
 * area, because area is wealth. Pure: the stage plays these on its timeline.
 */
import type { Point } from '../../../shared/layout';

/** Gravity on the stage, px/s², from its scale: a coin falls from the title in about half a second. */
export const gravity = (whole: number) => 13.5 * whole;

/** Seconds to fall `h` from rest under `g`. */
export const fallTime = (h: number, g: number) => Math.sqrt((2 * Math.max(0, h)) / g);

/** An area-keeping squash: e^q wide, e^−q tall (q < 0 stretches). */
export const squashed = (q: number) => ({ sx: Math.exp(q), sy: Math.exp(-q) });

/** How a body of radius `r` moves, where `unit` is the body of a single coin. */
export interface Gait {
  /** How high a hop rises above the higher end, and how far it goes at most, px. */
  readonly height: number;
  readonly length: number;
  /** Seconds crouching before take-off, and settling after landing. */
  readonly crouch: number;
  readonly settle: number;
  /** Landing squash and take-off stretch, as `squashed` takes them. */
  readonly squash: number;
  readonly stretch: number;
  /** 0 hard … 1 soft. */
  readonly soft: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function gait(r: number, unit: number, g: number): Gait {
  const soft = clamp((r / unit - 1) / 3.5, 0, 1);
  const height = 0.55 * r;
  const flight = 2 * fallTime(height, g);
  return {
    height,
    length: 1.5 * r,
    crouch: flight * (0.3 + 0.25 * soft),
    settle: flight * (0.35 + 0.6 * soft),
    squash: 0.06 + 0.16 * soft,
    stretch: 0.04 + 0.08 * soft,
    soft,
  };
}

/** One hop: from, to, the top of its arc, and when each part happens (seconds). */
export interface Hop {
  readonly from: Point;
  readonly to: Point;
  readonly top: number;
  /** Crouch begins; leaves the ground; the top; touches down; settled. */
  readonly start: number;
  readonly lift: number;
  readonly apex: number;
  readonly land: number;
  readonly end: number;
  readonly gait: Gait;
}

/**
 * The hops that carry a body of radius `r` from `from` to `to`, leaving at
 * `depart`: as few as its gait allows, each under `g` — up from rest to the
 * top and down again, the halves timed by the heights they fall. A body
 * between hops only half settles; the last hop settles fully. None if it is
 * already there. `lift` scales the hops' height (a little hop on the spot);
 * `stride` their length — a body travelling far bounds, as animals do: the
 * same height, so the same time in the air under g, but further each time.
 */
export function hopsAlong(from: Point, to: Point, depart: number, r: number, unit: number, g: number, lift = 1, stride = 1): Hop[] {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  if (d < 0.5) return [];
  const gt = gait(r, unit, g);
  const n = Math.max(1, Math.ceil(d / (gt.length * stride)));
  const hops: Hop[] = [];
  let t = depart;
  for (let k = 0; k < n; k++) {
    const a = { x: from.x + ((to.x - from.x) * k) / n, y: from.y + ((to.y - from.y) * k) / n };
    const b = { x: from.x + ((to.x - from.x) * (k + 1)) / n, y: from.y + ((to.y - from.y) * (k + 1)) / n };
    const top = Math.min(a.y, b.y) - gt.height * lift;
    const start = t;
    const off = start + gt.crouch;
    const apex = off + fallTime(a.y - top, g);
    const land = apex + fallTime(b.y - top, g);
    const end = land + gt.settle * (k === n - 1 ? 1 : 0.45);
    hops.push({ from: a, to: b, top, start, lift: off, apex, land, end, gait: gt });
    t = end;
  }
  return hops;
}

/** When a run of hops is over: the last one settled (or `depart`, for none). */
export const arrival = (hops: readonly Hop[], depart: number) => (hops.length ? hops[hops.length - 1].end : depart);

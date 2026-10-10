/**
 * The room's poses for the concept acts (iteration-2 brief 5.1–5.3; ADR-018:
 * "room poses are the room module's own closed vocabulary"). Pure: given what
 * everyone holds and the room's box, where everyone stands in each picture.
 *
 * - `piles`  — a histogram: everyone drops into a pile by how much they hold,
 *              keeping their costumes; the ruler is ordinary, ticks are round.
 * - `ruler`  — the same people on a multiplying ruler; under a cent goes in the
 *              dust box, because zero has no place on it.
 * - `line`   — everyone in a row, poorest first, under a square plot of the
 *              running total of their money: the Lorenz curve, and the Gini.
 *
 * Everyone is one marker size in these pictures: a person counts once, and
 * where they stand says how much they have. The ruler's decade marks are keyed
 * the same in `piles` and `ruler`, so they can slide from crowded to even.
 */
import { decadeEdges, keepLabels, type RulerLabel } from '../../../distribution/rulerLabels';
import { dollarsCompact } from '../../../shared/format';
import { DUST_DOLLARS } from '../../../shared/presets';
import type { Point } from '../../../shared/layout';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Tick {
  readonly key: string;
  readonly x: number;
  readonly label: string;
  readonly shown: boolean;
}

export interface Pile {
  readonly x0: number;
  readonly x1: number;
  readonly count: number;
  /** Just above the pile's top marker: where its count is written. */
  readonly top: number;
}

export interface PilesPose {
  readonly spots: readonly Point[];
  readonly marker: number;
  readonly piles: readonly Pile[];
  readonly ticks: readonly Tick[];
  readonly axisY: number;
  /** The ruler's end, a round amount. */
  readonly top: number;
  /** Which pile each person is in. */
  readonly pileOf: readonly number[];
}

export interface RulerPose {
  readonly spots: readonly Point[];
  readonly marker: number;
  readonly ticks: readonly Tick[];
  readonly axisY: number;
  /** Its bins, the dust box first, then one a decade: the same bins the charts column draws. */
  readonly piles: readonly Pile[];
  readonly pileOf: readonly number[];
  /** The bins' edges in dollars: the dust bin from a tenth of a cent, then decade by decade to `top`. */
  readonly edges: readonly number[];
  readonly top: number;
  readonly dust: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly count: number };
}

export interface LinePose {
  readonly spots: readonly Point[];
  /** Everyone's radius in the row: their own sizes, scaled together to fit under the plot. */
  readonly radii: readonly number[];
  readonly marker: number;
  /** The Lorenz plot, square: population along the bottom, share of the money up the side. */
  readonly frame: Box;
  /** The running total, one point per person, from (0, 0) to (1, 1), in stage px. */
  readonly curve: readonly Point[];
  /** Where equal shares would climb: the diagonal, in stage px. */
  readonly diagonal: readonly [Point, Point];
  /** Who stands at each place in the row, poorest first. */
  readonly order: readonly number[];
  /** Everyone's place in the row. */
  readonly rank: readonly number[];
  /**
   * The walk's circle after eating the first k in the row: the radius whose
   * area is all of theirs together (index k, 0…n) — at the end, one circle
   * holding everything.
   */
  readonly eaten: readonly number[];
  /** Where the population axis's label sits: under the plot's ticks, over the row. */
  readonly labelY: number;
}

/** Ruler steps a reader can say out loud: 1, 2, 2.5 or 5 times a power of ten. */
export function roundStep(span: number, most = 5): number {
  const raw = span / most;
  const power = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * power >= raw) return m * power;
  return 10 * power;
}

/** A round end for an ordinary ruler that reaches `max`, and the step between its ticks. */
export function roundRuler(max: number): { top: number; step: number } {
  const step = roundStep(Math.max(max, 1e-9), 4);
  return { top: Math.ceil(max / step - 1e-9) * step, step };
}

const MARKER_GAP = 1.6;
const CHAR_W = 6.6;

function decadeTicks(top: number, xOf: (value: number) => number | null, fixed: RulerLabel[]): Tick[] {
  const decades = decadeEdges(DUST_DOLLARS, Math.max(top, DUST_DOLLARS * 10));
  const marks = decades.map((value, k) => ({ key: `decade-${k}`, value, x: xOf(value) }));
  const candidates: RulerLabel[] = [...fixed];
  const onRuler = marks.filter((m) => m.x !== null) as { key: string; value: number; x: number }[];
  onRuler.forEach((m, k) =>
    candidates.push({ key: m.key, x: m.x, text: dollarsCompact(m.value), priority: fixed.length + (onRuler.length - 1 - k), anchor: 'middle' }),
  );
  const shown = keepLabels(candidates, CHAR_W, 6);
  const fixedTicks = fixed.map((f) => ({ key: f.key, x: f.x, label: f.text, shown: shown.has(f.key) }));
  const decadeMarks = marks.map((m) => ({
    key: m.key,
    x: m.x ?? Number.NaN,
    label: dollarsCompact(m.value),
    shown: m.x !== null && shown.has(m.key),
  }));
  return [...fixedTicks, ...decadeMarks];
}

/** The biggest marker, up to `most`, whose piles all fit the box. */
function fitMarker(counts: readonly number[], width: number, height: number, most: number): { r: number; perRow: number } {
  for (let r = most; r > 1.2; r -= 0.25) {
    const step = 2 * r + MARKER_GAP;
    const perRow = Math.max(1, Math.floor((width - 6) / step));
    const rows = Math.max(...counts.map((c) => Math.ceil(c / perRow)));
    if (rows * step <= height) return { r, perRow };
  }
  const r = 1.2;
  return { r, perRow: Math.max(1, Math.floor((width - 6) / (2 * r + MARKER_GAP))) };
}

/** What fixes a histogram while the room moves through time: its ruler's end, and everyone's one marker size. */
export interface HistogramFix {
  readonly top?: number;
  readonly marker?: number;
}

/** The ordinary ruler's bins. */
export const LINEAR_BINS = 8;

/**
 * The one marker both rulers use, whatever the moment (owner, 2026-10-10:
 * "when moving from linear to log scale, the size of shapes changes. that is
 * wrong"): big enough to see, small enough that all `n` fit in one bin of
 * either ruler — as they do at the start, everyone equal.
 */
export function histogramMarker(n: number, box: Box, logTop: number, most = 12): number {
  const axisY = box.y + box.h - 22;
  const logBins = Math.max(1, Math.round(Math.log10(logTop / DUST_DOLLARS))) + 1;
  const narrowest = Math.min(box.w / LINEAR_BINS, (box.w - DUST_GAP) / logBins);
  return fitMarker([n], narrowest, (axisY - box.y) * 0.82, most).r;
}

/** Everyone into their bin, poorest first, rows filling up from the ruler: where each stands, and each bin's top. */
function stackBins(amounts: ArrayLike<number>, binOf: readonly number[], x0s: readonly number[], x1s: readonly number[], r: number, axisY: number): { spots: Point[]; piles: Pile[] } {
  const n = amounts.length;
  const cell = 2 * r + MARKER_GAP;
  const bins = x0s.length;
  const counts = new Array<number>(bins).fill(0);
  for (const b of binOf) counts[b]++;
  const perRow = x0s.map((x0, b) => Math.max(1, Math.floor((x1s[b] - x0 - 6) / cell)));
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => amounts[a] - amounts[b] || a - b);
  const seen = new Array<number>(bins).fill(0);
  const spots = new Array<Point>(n);
  for (const i of order) {
    const b = binOf[i];
    const slot = seen[b]++;
    const row = Math.floor(slot / perRow[b]);
    const inRow = Math.min(perRow[b], counts[b] - row * perRow[b]);
    const col = slot % perRow[b];
    spots[i] = { x: (x0s[b] + x1s[b]) / 2 + (col - (inRow - 1) / 2) * cell, y: axisY - r - 2 - row * cell };
  }
  const piles = counts.map((count, b) => ({ x0: x0s[b], x1: x1s[b], count, top: axisY - 2 - Math.ceil(count / perRow[b]) * cell - 8 }));
  return { spots, piles };
}

export function piles(amounts: ArrayLike<number>, box: Box, fix: HistogramFix = {}, bins = LINEAR_BINS, most = 12): PilesPose {
  const n = amounts.length;
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, amounts[i]);
  const { top, step } = roundRuler(fix.top ?? max);
  const width = top / bins;
  const axisY = box.y + box.h - 22;
  const colW = box.w / bins;
  const pileOf = Array.from({ length: n }, (_, i) => Math.max(0, Math.min(bins - 1, Math.floor(amounts[i] / width))));
  const counts = new Array<number>(bins).fill(0);
  for (const b of pileOf) counts[b]++;
  const r = fix.marker ?? fitMarker(counts, colW, (axisY - box.y) * 0.82, most).r;
  const x0s = counts.map((_, b) => box.x + b * colW);
  const { spots, piles } = stackBins(amounts, pileOf, x0s, x0s.map((x) => x + colW), r, axisY);
  const xOf = (value: number) => (value <= top * 1.0001 ? box.x + (value / top) * box.w : null);
  const fixed: RulerLabel[] = [];
  for (let k = 0, v = 0; v <= top + 1e-9; k++, v = k * step) {
    fixed.push({ key: `round-${k}`, x: box.x + (v / top) * box.w, text: v === 0 ? '$0' : dollarsCompact(v), priority: k === 0 ? 0 : 1, anchor: k === 0 ? 'start' : 'middle' });
  }
  return { spots, marker: r, piles, ticks: decadeTicks(top, xOf, fixed), axisY, top, pileOf };
}

/**
 * The multiplying ruler's bins, wherever they are drawn (the room's stacks and
 * every histogram beside it count alike): everything under a cent in the
 * dust bin, then one bin a decade up to `top`.
 */
export function decadeBins(amounts: ArrayLike<number>, top: number): { edges: number[]; counts: number[]; binOf: number[] } {
  const decades = Math.max(1, Math.round(Math.log10(top / DUST_DOLLARS)));
  const binOf = Array.from({ length: amounts.length }, (_, i) =>
    amounts[i] < DUST_DOLLARS ? 0 : 1 + Math.max(0, Math.min(decades - 1, Math.floor(Math.log10(amounts[i] / DUST_DOLLARS) + 1e-9))),
  );
  const counts = new Array<number>(decades + 1).fill(0);
  for (const b of binOf) counts[b]++;
  return { edges: [DUST_DOLLARS / 10, ...Array.from({ length: decades + 1 }, (_, k) => DUST_DOLLARS * 10 ** k)], counts, binOf };
}

/** Between the dust box and the multiplying ruler. */
const DUST_GAP = 14;

/**
 * The multiplying ruler, binned like the ordinary one (owner, 2026-10-10: "the
 * bins in log scale has problem"): under a cent in the dust box, then one bin a
 * decade, all as wide as each other, everyone stacked in their own. With `fix`,
 * the ruler's end and the marker hold still while the room moves in time.
 */
export function ruler(amounts: ArrayLike<number>, box: Box, fix: HistogramFix = {}, most = 7): RulerPose {
  const n = amounts.length;
  let max = DUST_DOLLARS * 10;
  for (let i = 0; i < n; i++) max = Math.max(max, amounts[i]);
  const top = fix.top ?? 10 ** Math.ceil(Math.log10(max / DUST_DOLLARS) - 1e-9) * DUST_DOLLARS;
  const decades = Math.max(1, Math.round(Math.log10(top / DUST_DOLLARS)));
  const axisY = box.y + box.h - 22;
  const colW = (box.w - DUST_GAP) / (decades + 1);
  const start = box.x + colW + DUST_GAP;
  const xOf = (value: number) => (value < DUST_DOLLARS ? null : start + (Math.log10(value / DUST_DOLLARS) / decades) * (box.x + box.w - start));
  const { edges, counts, binOf } = decadeBins(amounts, top);
  const x0s = [box.x, ...Array.from({ length: decades }, (_, k) => start + k * colW)];
  const x1s = x0s.map((x) => x + colW);
  const r = fix.marker ?? fitMarker(counts, colW, (axisY - box.y) * 0.82, most).r;
  const { spots, piles } = stackBins(amounts, binOf, x0s, x1s, r, axisY);
  const dust = piles[0];
  return {
    spots,
    marker: r,
    ticks: decadeTicks(top, xOf, []),
    axisY,
    dust: { x: dust.x0, y: dust.top, w: dust.x1 - dust.x0, h: axisY - dust.top, count: dust.count },
    piles,
    pileOf: binOf,
    edges,
    top,
  };
}

/** The walk's whole circle, as a share of the plot's side: everyone's money in one, whatever the moment. */
export const TOTAL_R = 0.11;

/**
 * Everyone in a line, poorest first, under a square Lorenz plot (owner review
 * 2026-09-26: "the gini plot should be square, with proper axes"). Everyone
 * keeps their own size — area is wealth, on one scale fixed by the plot, so
 * all the money together is always a circle of `TOTAL_R` of its side (owner,
 * 2026-10-10: "the big cumsum circle always must have the same size"). The
 * plot's place and size depend on the box alone, never on the room, so it
 * holds still while the room moves through time: only the curve changes. Each
 * stands under their own stretch of the curve, the k-th poorest at the middle
 * of the k-th hundredth, overlapping where they must. With `beside`, the plot
 * leaves the far side of the box free (the talk goes there).
 */
export function line(amounts: ArrayLike<number>, box: Box, beside = false): LinePose {
  const n = amounts.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => amounts[a] - amounts[b] || a - b);
  /** Room for the plot's own labels: the money axis on the left, the ticks and the population label below. */
  const LEFT = 56;
  const BELOW = 44;
  // the largest square that leaves room under it for a row as tall as everyone
  // together, and room past its right edge for the richest, who stands at its end
  const most = Math.max(40, Math.min((box.w - LEFT - 8) / (1 + TOTAL_R), beside ? box.w * 0.55 : Infinity));
  let side = most;
  for (; side > 40; side -= 2) if (side + BELOW + 10 + 2 * TOTAL_R * side + 4 <= box.h) break;
  const R = TOTAL_R * side;
  let total = 0;
  for (let i = 0; i < n; i++) total += Math.max(0, amounts[i]);
  const r = (i: number) => Math.max(0.6, R * Math.sqrt(total > 0 ? Math.max(0, amounts[i]) / total : 1 / n));
  const floor = box.y + box.h - 4;
  const frame = { x: box.x + LEFT, y: floor - 2 * R - 10 - BELOW - side, w: side, h: side };
  const spots = new Array<Point>(n);
  order.forEach((i, rank) => (spots[i] = { x: frame.x + ((rank + 0.5) / n) * side, y: floor - r(i) }));
  const curve: Point[] = [{ x: frame.x, y: frame.y + frame.h }];
  let running = 0;
  order.forEach((i, rank) => {
    running += Math.max(0, amounts[i]);
    curve.push({ x: frame.x + ((rank + 1) / n) * frame.w, y: frame.y + frame.h - (total > 0 ? running / total : 0) * frame.h });
  });
  return {
    spots,
    radii: Array.from({ length: n }, (_, i) => r(i)),
    marker: R / Math.sqrt(n),
    frame,
    curve,
    diagonal: [
      { x: frame.x, y: frame.y + frame.h },
      { x: frame.x + frame.w, y: frame.y },
    ],
    order,
    rank: order.reduce((out, i, k) => ((out[i] = k), out), new Array<number>(n)),
    // the running total as a circle: its area is everyone's so far, and all of it is R
    eaten: [0, ...order.map((_, k) => R * Math.sqrt(curveShare(curve, k + 1, frame)))],
    labelY: frame.y + frame.h + BELOW - 8,
  };
}

/** The running total's share after the first k, read off the curve. */
const curveShare = (curve: readonly Point[], k: number, frame: Box) => (frame.y + frame.h - curve[k].y) / frame.h;

/** 1 / Σ s², for shares of any total: how many equal fortunes would be as concentrated. */
export function effectiveCount(shares: ArrayLike<number>): number {
  let sum = 0;
  let squares = 0;
  for (let i = 0; i < shares.length; i++) {
    sum += shares[i];
    squares += shares[i] * shares[i];
  }
  return squares > 0 ? (sum * sum) / squares : 0;
}

/**
 * Scene 17's imagined rooms, as everyone's share (owner, 2026-09-26): all
 * equal · `emptied` has nothing (the money is simply gone) · `emptied`'s money
 * went to `given` instead · the first half (by `half`) own it all, equally ·
 * `owner` owns everything.
 */
/** The rooms Scene 17 imagines before it counts the real one. */
export type ImaginedRoom = 'equal' | 'zero' | 'half' | 'one' | 'halves';
/** A step through the room that visits everyone once (coprime to a hundred), so halves land apart. */
const SPREAD = 37;

export function imaginedShares(
  mode: ImaginedRoom,
  n: number,
  who: { emptied: number; given: number; owner: number; half: (i: number) => boolean },
): Float64Array {
  const shares = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    switch (mode) {
      case 'equal':
        shares[i] = 1 / n;
        break;
      case 'zero':
        shares[i] = i === who.emptied ? 0 : 1 / n;
        break;
      case 'half':
        shares[i] = who.half(i) ? 2 / n : 0;
        break;
      case 'one':
        shares[i] = i === who.owner ? 1 : 0;
        break;
      case 'halves':
        break;
    }
  }
  if (mode === 'halves') {
    // each holds half of what the one before holds (owner, 2026-10-10: "1, 1/2, 1/4, 1/8 …"),
    // scaled to the room's whole wealth; spread through the room, not in a heap
    let sum = 0;
    for (let k = 0; k < n; k++) sum += 2 ** -k;
    for (let k = 0; k < n; k++) shares[(who.owner + k * SPREAD) % n] = 2 ** -k / sum;
  }
  return shares;
}

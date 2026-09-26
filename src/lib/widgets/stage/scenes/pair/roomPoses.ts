/**
 * The room's poses for the concept acts (iteration-2 brief 5.1–5.3; ADR-018:
 * "room poses are the room module's own closed vocabulary"). Pure: given what
 * everyone holds and the room's box, where everyone stands in each picture.
 *
 * - `piles`  — a histogram: everyone drops into a pile by how much they hold,
 *              keeping their costumes; the ruler is ordinary, ticks are round.
 * - `ruler`  — the same people on a multiplying ruler; under a cent goes in the
 *              dust box, because zero has no place on it.
 * - `line`   — everyone in a row, poorest first, with the running total of
 *              their money drawn above them: the Lorenz curve, and the Gini.
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
  readonly dust: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly count: number };
}

export interface LinePose {
  readonly spots: readonly Point[];
  readonly marker: number;
  /** The Lorenz frame: population along the bottom, share of the money up the side. */
  readonly frame: Box;
  /** The running total, one point per person, from (0, 0) to (1, 1), in stage px. */
  readonly curve: readonly Point[];
  /** Where equal shares would climb: the diagonal, in stage px. */
  readonly diagonal: readonly [Point, Point];
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

export function piles(amounts: ArrayLike<number>, box: Box, bins = 8, most = 7): PilesPose {
  const n = amounts.length;
  let max = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, amounts[i]);
  const { top, step } = roundRuler(max);
  const width = top / bins;
  const axisY = box.y + box.h - 22;
  const colW = box.w / bins;
  const pileOf = Array.from({ length: n }, (_, i) => Math.min(bins - 1, Math.floor(amounts[i] / width)));
  const counts = new Array<number>(bins).fill(0);
  for (const b of pileOf) counts[b]++;
  const { r, perRow } = fitMarker(counts, colW, (axisY - box.y) * 0.82, most);
  const cell = 2 * r + MARKER_GAP;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => amounts[a] - amounts[b] || a - b);
  const seen = new Array<number>(bins).fill(0);
  const spots = new Array<Point>(n);
  for (const i of order) {
    const b = pileOf[i];
    const slot = seen[b]++;
    const row = Math.floor(slot / perRow);
    const inRow = Math.min(perRow, counts[b] - row * perRow);
    const col = slot % perRow;
    spots[i] = {
      x: box.x + b * colW + colW / 2 + (col - (inRow - 1) / 2) * cell,
      y: axisY - r - 2 - row * cell,
    };
  }
  const piles = counts.map((count, b) => ({
    x0: box.x + b * colW,
    x1: box.x + (b + 1) * colW,
    count,
    top: axisY - 2 - Math.ceil(count / perRow) * cell - 8,
  }));
  const xOf = (value: number) => (value <= top * 1.0001 ? box.x + (value / top) * box.w : null);
  const fixed: RulerLabel[] = [];
  for (let k = 0, v = 0; v <= top + 1e-9; k++, v = k * step) {
    fixed.push({ key: `round-${k}`, x: box.x + (v / top) * box.w, text: v === 0 ? '$0' : dollarsCompact(v), priority: k === 0 ? 0 : 1, anchor: k === 0 ? 'start' : 'middle' });
  }
  return { spots, marker: r, piles, ticks: decadeTicks(top, xOf, fixed), axisY, top, pileOf };
}

export function ruler(amounts: ArrayLike<number>, box: Box, most = 7): RulerPose {
  const n = amounts.length;
  let max = DUST_DOLLARS * 10;
  for (let i = 0; i < n; i++) max = Math.max(max, amounts[i]);
  const top = 10 ** Math.ceil(Math.log10(max / DUST_DOLLARS) - 1e-9) * DUST_DOLLARS;
  const axisY = box.y + box.h - 22;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => amounts[a] - amounts[b] || a - b);
  const dustCount = order.filter((i) => amounts[i] < DUST_DOLLARS).length;

  for (let r = most; r > 1.2; r -= 0.25) {
    const cell = 2 * r + MARKER_GAP;
    const dustCols = 5;
    const dustW = dustCols * cell + 10;
    const x0 = box.x + dustW + 18;
    const w = box.w - (x0 - box.x) - 10;
    const xOf = (value: number) =>
      value < DUST_DOLLARS ? null : x0 + (Math.log10(value / DUST_DOLLARS) / Math.log10(top / DUST_DOLLARS)) * w;
    const stacks = new Map<number, number>();
    const spots = new Array<Point>(n);
    let dustSeen = 0;
    let tallest = 0;
    for (const i of order) {
      const x = xOf(amounts[i]);
      if (x === null) {
        const slot = dustSeen++;
        spots[i] = { x: box.x + 5 + r + (slot % dustCols) * cell, y: axisY - r - 2 - Math.floor(slot / dustCols) * cell };
        tallest = Math.max(tallest, Math.floor(slot / dustCols) + 1);
        continue;
      }
      const column = Math.round(x / cell);
      const level = stacks.get(column) ?? 0;
      stacks.set(column, level + 1);
      tallest = Math.max(tallest, level + 1);
      spots[i] = { x: column * cell, y: axisY - r - 2 - level * cell };
    }
    if (tallest * cell > (axisY - box.y) * 0.82 && r > 1.5) continue;
    const dustRows = Math.ceil(dustCount / dustCols);
    return {
      spots,
      marker: r,
      ticks: decadeTicks(top, xOf, []),
      axisY,
      dust: { x: box.x, y: axisY - dustRows * cell - 8, w: dustW, h: dustRows * cell + 8, count: dustCount },
    };
  }
  throw new Error('unreachable: the smallest marker always fits');
}

export function line(amounts: ArrayLike<number>, box: Box): LinePose {
  const n = amounts.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => amounts[a] - amounts[b] || a - b);
  const pitch = box.w / n;
  const r = Math.max(1.2, Math.min(6, pitch / 2 - 0.6));
  const baseY = box.y + box.h - r - 4;
  const frame = { x: box.x, y: box.y + 6, w: box.w, h: baseY - r - 10 - (box.y + 6) };
  const spots = new Array<Point>(n);
  order.forEach((i, rank) => (spots[i] = { x: box.x + (rank + 0.5) * pitch, y: baseY }));
  let total = 0;
  for (let i = 0; i < n; i++) total += amounts[i];
  const curve: Point[] = [{ x: frame.x, y: frame.y + frame.h }];
  let running = 0;
  order.forEach((i, rank) => {
    running += amounts[i];
    curve.push({ x: frame.x + ((rank + 1) / n) * frame.w, y: frame.y + frame.h - (total > 0 ? running / total : 0) * frame.h });
  });
  return {
    spots,
    marker: r,
    frame,
    curve,
    diagonal: [
      { x: frame.x, y: frame.y + frame.h },
      { x: frame.x + frame.w, y: frame.y },
    ],
  };
}

/**
 * Phase-map computation for the tax-versus-stake beat (outline beat 23).
 *
 * Everything here is MEASURED from the same engine primitives the essay runs;
 * the "critical line" is a numerically FITTED curve (τ* ≈ c·β² family, from
 * the per-trade variance ∝ β² scaling heuristic), never a theorem. Keep the
 * word "fitted" attached to it wherever it is shown (GATE, interventions.md).
 */
import { createRandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
import { applyFlatWealthLevy } from './interventions';
import { giniCoefficient } from './metrics';

export interface PhaseCellConfig {
  readonly n: number;
  readonly beta: number;
  /** Flat wealth-levy rate applied every `levyEvery` trades. */
  readonly taxRate: number;
  readonly levyEvery: number;
  readonly trades: number;
  /** Trades to run before sampling begins (burn-in). */
  readonly burnIn: number;
  /** Gini samples averaged over the tail, evenly spaced. */
  readonly tailSamples: number;
  readonly seed: number;
}

/** Equilibrium Gini for one (β, τ) cell: mean of tail checkpoints. */
export function runPhaseCell(config: PhaseCellConfig): number {
  const { n, beta, taxRate, levyEvery, trades, burnIn, tailSamples, seed } = config;
  const wealth = new Float64Array(n).fill(1 / n);
  const random = createRandomSource(seed);

  let sum = 0;
  let samples = 0;
  const sampleEvery = Math.max(1, Math.floor((trades - burnIn) / tailSamples));

  for (let t = 1; t <= trades; t++) {
    const a = Math.floor(random.next() * n);
    let b = Math.floor(random.next() * (n - 1));
    if (b >= a) b++;
    applyYardSaleTrade(wealth, a, b, beta, random.next() < 0.5);
    if (taxRate > 0 && t % levyEvery === 0) applyFlatWealthLevy(wealth, taxRate);
    if (t > burnIn && (t - burnIn) % sampleEvery === 0) {
      sum += giniCoefficient(wealth);
      samples++;
    }
  }
  return samples === 0 ? giniCoefficient(wealth) : sum / samples;
}

export interface ContourSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/**
 * Marching squares on a grid[iy][ix] of values with axis coordinates xs/ys;
 * returns line segments (in axis units) tracing `level`.
 */
export function contourSegments(
  grid: readonly (readonly number[])[],
  xs: readonly number[],
  ys: readonly number[],
  level: number,
): ContourSegment[] {
  const segments: ContourSegment[] = [];
  const lerp = (a: number, b: number, va: number, vb: number) =>
    vb === va ? (a + b) / 2 : a + ((level - va) / (vb - va)) * (b - a);

  for (let iy = 0; iy < ys.length - 1; iy++) {
    for (let ix = 0; ix < xs.length - 1; ix++) {
      const v00 = grid[iy][ix]; // bottom-left  (xs[ix], ys[iy])
      const v10 = grid[iy][ix + 1];
      const v01 = grid[iy + 1][ix];
      const v11 = grid[iy + 1][ix + 1];
      let caseId = 0;
      if (v00 > level) caseId |= 1;
      if (v10 > level) caseId |= 2;
      if (v11 > level) caseId |= 4;
      if (v01 > level) caseId |= 8;
      if (caseId === 0 || caseId === 15) continue;

      // edge interpolation points
      const bottom = { x: lerp(xs[ix], xs[ix + 1], v00, v10), y: ys[iy] };
      const top = { x: lerp(xs[ix], xs[ix + 1], v01, v11), y: ys[iy + 1] };
      const left = { x: xs[ix], y: lerp(ys[iy], ys[iy + 1], v00, v01) };
      const right = { x: xs[ix + 1], y: lerp(ys[iy], ys[iy + 1], v10, v11) };

      const push = (p: { x: number; y: number }, q: { x: number; y: number }) =>
        segments.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y });

      switch (caseId) {
        case 1: case 14: push(left, bottom); break;
        case 2: case 13: push(bottom, right); break;
        case 3: case 12: push(left, right); break;
        case 4: case 11: push(top, right); break;
        case 5: push(left, top); push(bottom, right); break;
        case 6: case 9: push(bottom, top); break;
        case 7: case 8: push(left, top); break;
        case 10: push(left, bottom); push(top, right); break;
      }
    }
  }
  return segments;
}

export interface FittedCurve {
  /** τ*(β) = c · β² */
  readonly c: number;
  /** The measured crossing points the fit ran through. */
  readonly crossings: readonly { beta: number; tax: number }[];
}

/**
 * For each β column, find the tax rate where Gini crosses `level` (linear
 * interpolation down the column), then least-squares fit τ* = c·β² through
 * the crossings. Returns null when fewer than two columns cross.
 */
export function fitCriticalCurve(
  grid: readonly (readonly number[])[],
  betas: readonly number[],
  taxes: readonly number[],
  level: number,
): FittedCurve | null {
  const crossings: { beta: number; tax: number }[] = [];
  for (let ix = 0; ix < betas.length; ix++) {
    for (let iy = 0; iy < taxes.length - 1; iy++) {
      const a = grid[iy][ix];
      const b = grid[iy + 1][ix];
      // gini falls as tax rises; find the first bracket around the level
      if ((a > level && b <= level) || (a >= level && b < level)) {
        const t = taxes[iy] + ((a - level) / (a - b)) * (taxes[iy + 1] - taxes[iy]);
        crossings.push({ beta: betas[ix], tax: t });
        break;
      }
    }
  }
  if (crossings.length < 2) return null;
  // least squares for τ = c·β²: c = Σ(τ·β²) / Σ(β⁴)
  let num = 0;
  let den = 0;
  for (const { beta, tax } of crossings) {
    num += tax * beta * beta;
    den += beta ** 4;
  }
  return { c: num / den, crossings };
}

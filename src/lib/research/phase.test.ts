import { describe, expect, it } from 'vitest';
import { contourSegments, fitCriticalCurve, IncrementalPhaseCell, runPhaseCell } from './phase';

describe('runPhaseCell', () => {
  const base = { n: 50, levyEvery: 50, trades: 20_000, burnIn: 10_000, tailSamples: 5, seed: 7 };

  it('is deterministic under the same seed', () => {
    const a = runPhaseCell({ ...base, beta: 0.2, taxRate: 0.02 });
    const b = runPhaseCell({ ...base, beta: 0.2, taxRate: 0.02 });
    expect(a).toBe(b);
  });

  it('has the same estimator regardless of incremental batch size', () => {
    const config = { ...base, beta: 0.2, taxRate: 0.02 };
    const expected = runPhaseCell(config);
    const incremental = new IncrementalPhaseCell(config);
    while (!incremental.done) incremental.step(137);
    expect(incremental.result()).toBe(expected);
  });

  it('concentrates more at higher stakes when untaxed', () => {
    const low = runPhaseCell({ ...base, beta: 0.05, taxRate: 0 });
    const high = runPhaseCell({ ...base, beta: 0.4, taxRate: 0 });
    expect(high).toBeGreaterThan(low);
  });

  it('concentrates less as the levy rises at a fixed stake', () => {
    const untaxed = runPhaseCell({ ...base, beta: 0.3, taxRate: 0 });
    const taxed = runPhaseCell({ ...base, beta: 0.3, taxRate: 0.1 });
    expect(taxed).toBeLessThan(untaxed);
  });
});

describe('contourSegments', () => {
  it('traces a horizontal frontier on a field that ramps with y', () => {
    const xs = [0, 1, 2];
    const ys = [0, 1];
    // value = y: level 0.5 crosses every column between the two rows
    const grid = ys.map((y) => xs.map(() => y));
    const segments = contourSegments(grid, xs, ys, 0.5);
    expect(segments.length).toBe(xs.length - 1);
    for (const s of segments) {
      expect(s.y1).toBeCloseTo(0.5, 12);
      expect(s.y2).toBeCloseTo(0.5, 12);
    }
  });

  it('returns nothing when the level never crosses', () => {
    const grid = [
      [0.9, 0.9],
      [0.8, 0.8],
    ];
    expect(contourSegments(grid, [0, 1], [0, 1], 0.5)).toEqual([]);
  });
});

describe('fitCriticalCurve', () => {
  it('recovers a planted tax = c·beta² frontier', () => {
    const c = 0.42;
    const betas = [0.1, 0.2, 0.3, 0.4, 0.5];
    const taxes = Array.from({ length: 25 }, (_, i) => i * 0.005);
    // linear-in-tax columns crossing 0.5 exactly at tax = c·beta²
    const grid = taxes.map((tax) => betas.map((beta) => 0.5 + (c * beta * beta - tax)));
    const fit = fitCriticalCurve(grid, betas, taxes, 0.5);
    expect(fit).not.toBeNull();
    expect(fit!.c).toBeCloseTo(c, 3);
    expect(fit!.crossings.length).toBe(betas.length);
  });

  it('returns null when fewer than two columns cross', () => {
    const grid = [
      [0.9, 0.9],
      [0.8, 0.8],
    ];
    expect(fitCriticalCurve(grid, [0.1, 0.2], [0, 0.01], 0.5)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  contourSegments,
  fitSquareRelationship,
  IncrementalOutcomeRun,
  OUTCOME_PROTOCOL_VERSION,
  runOutcome,
} from './phase';

describe('runOutcome', () => {
  const base = {
    version: OUTCOME_PROTOCOL_VERSION,
    n: 50,
    tradesPerRound: 50,
    levyEveryRounds: 1,
    trades: 20_000,
    burnIn: 10_000,
    tailSamples: 5,
    seed: 7,
  } as const;

  it('is deterministic under the same seed', () => {
    const a = runOutcome({ ...base, beta: 0.2, taxRate: 0.02 });
    const b = runOutcome({ ...base, beta: 0.2, taxRate: 0.02 });
    expect(a).toEqual(b);
  });

  it('has the same estimator regardless of incremental batch size', () => {
    const config = { ...base, beta: 0.2, taxRate: 0.02 };
    const expected = runOutcome(config);
    const incremental = new IncrementalOutcomeRun(config);
    while (!incremental.done) incremental.step(137);
    expect(incremental.result()).toEqual(expected);
  });

  it('concentrates more at higher stakes when untaxed', () => {
    const low = runOutcome({ ...base, beta: 0.05, taxRate: 0 });
    const high = runOutcome({ ...base, beta: 0.4, taxRate: 0 });
    expect(high.gini).toBeGreaterThan(low.gini);
  });

  it('concentrates less as the levy rises at a fixed stake', () => {
    const untaxed = runOutcome({ ...base, beta: 0.3, taxRate: 0 });
    const taxed = runOutcome({ ...base, beta: 0.3, taxRate: 0.1 });
    expect(taxed.gini).toBeLessThan(untaxed.gini);
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

describe('fitSquareRelationship', () => {
  it('recovers a planted tax = c·beta² frontier', () => {
    const c = 0.42;
    const betas = [0.1, 0.2, 0.3, 0.4, 0.5];
    const taxes = Array.from({ length: 25 }, (_, i) => i * 0.005);
    // linear-in-tax columns crossing 0.5 exactly at tax = c·beta²
    const grid = taxes.map((tax) => betas.map((beta) => 0.5 + (c * beta * beta - tax)));
    const fit = fitSquareRelationship(grid, betas, taxes, 0.5, 'decreases');
    expect(fit).not.toBeNull();
    expect(fit!.c).toBeCloseTo(c, 3);
    expect(fit!.crossings.length).toBe(betas.length);
  });

  it('recovers the same frontier from an increasing participation metric', () => {
    const c = 0.35;
    const betas = [0, 0.1, 0.2, 0.3, 0.4];
    const taxes = Array.from({ length: 25 }, (_, i) => i * 0.005);
    const grid = taxes.map((tax) => betas.map((beta) => 10 + tax - c * beta * beta));
    const fit = fitSquareRelationship(grid, betas, taxes, 10, 'increases');
    expect(fit).not.toBeNull();
    expect(fit!.c).toBeCloseTo(c, 3);
    expect(fit!.crossings).toHaveLength(betas.length - 1); // beta = 0 is not fit evidence
  });

  it('returns null when fewer than two columns cross', () => {
    const grid = [
      [0.9, 0.9],
      [0.8, 0.8],
    ];
    expect(fitSquareRelationship(grid, [0.1, 0.2], [0, 0.01], 0.5, 'decreases')).toBeNull();
  });
});

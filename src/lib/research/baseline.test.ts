import { describe, expect, it } from 'vitest';
import { firstObservedConcentrationStep, runBaseline, runBaselineEnsemble } from './baseline';

describe('baseline research runner', () => {
  it('records compact checkpoints', () => {
    const run = runBaseline({ n: 10, beta: 0.5, seed: 3, checkpoints: [0, 10, 100] });
    expect(run.checkpoints.map(({ step }) => step)).toEqual([0, 10, 100]);
    expect(run.checkpoints[0].gini).toBe(0);
    expect(run.checkpoints[2].totalWealth).toBeCloseTo(1);
  });

  it('summarizes a reproducible ensemble', () => {
    const config = { n: 10, beta: 0.25, checkpoints: [0, 100] } as const;
    const first = runBaselineEnsemble(config, [1, 2, 3]);
    const second = runBaselineEnsemble(config, [1, 2, 3]);
    expect(second).toEqual(first);
    expect(first.summary[1].gini.q05).toBeLessThanOrEqual(first.summary[1].gini.q95);
  });

  it('rejects unordered checkpoints', () => {
    expect(() => runBaseline({ n: 10, beta: 0.5, seed: 1, checkpoints: [10, 10] })).toThrow('strictly');
  });

  it('reports a sampled concentration threshold or null', () => {
    expect(firstObservedConcentrationStep({ n: 10, beta: 0, seed: 1 }, 0.9, 1_000)).toBeNull();
    expect(firstObservedConcentrationStep({ n: 2, beta: 1, seed: 1 }, 1, 10, 1)).toBe(1);
  });
});

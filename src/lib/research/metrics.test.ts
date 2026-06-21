import { describe, expect, it } from 'vitest';
import {
  effectiveParticipantCount,
  giniCoefficient,
  lorenzCurve,
  measureWealth,
  quantile,
  topWealthShare,
} from './metrics';

describe('wealth metrics', () => {
  it('reports equality', () => {
    expect(measureWealth([1, 1, 1, 1])).toEqual({
      totalWealth: 4,
      gini: 0,
      topShare: 0.25,
      wealthFloor: 1,
      effectiveParticipants: 4,
    });
  });

  it('uses the standard finite-population Gini', () => {
    expect(giniCoefficient([0, 0, 0, 1])).toBeCloseTo(0.75);
    expect(topWealthShare([0, 0, 0, 1])).toBe(1);
    expect(effectiveParticipantCount([0, 0, 0, 1])).toBe(1);
  });

  it('builds a Lorenz curve including both endpoints', () => {
    expect(lorenzCurve([1, 3])).toEqual([
      { populationShare: 0, wealthShare: 0 },
      { populationShare: 0.5, wealthShare: 0.25 },
      { populationShare: 1, wealthShare: 1 },
    ]);
  });

  it('computes interpolated quantiles', () => {
    expect(quantile([0, 10], 0.25)).toBe(2.5);
  });

  it('rejects invalid wealth', () => {
    expect(() => giniCoefficient([])).toThrow('at least one');
    expect(() => giniCoefficient([1, -1])).toThrow('non-negative');
  });
});

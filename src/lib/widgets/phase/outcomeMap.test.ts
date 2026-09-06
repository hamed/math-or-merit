import { describe, expect, it } from 'vitest';
import { hasMinimumRuns, runsToMinimum } from './outcomeMap';

describe('outcome-map run minimum', () => {
  it('tops up reader cells without discarding runs above the minimum', () => {
    const counts = [
      [0, 1, 4],
      [3, 5, 7],
    ];

    expect(runsToMinimum(counts, 4)).toEqual([
      { ix: 0, iy: 0 }, { ix: 0, iy: 0 }, { ix: 0, iy: 0 }, { ix: 0, iy: 0 },
      { ix: 1, iy: 0 }, { ix: 1, iy: 0 }, { ix: 1, iy: 0 },
      { ix: 0, iy: 1 },
    ]);
    expect(hasMinimumRuns(counts, 4)).toBe(false);
    expect(hasMinimumRuns([[4, 4], [6, 9]], 4)).toBe(true);
  });
});

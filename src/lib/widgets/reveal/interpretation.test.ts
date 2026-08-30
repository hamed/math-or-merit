import { describe, expect, it } from 'vitest';
import type { LoggedRun } from '../shared/roomRun';
import { interpretRuns } from './interpretation';

const run = (winner: number, topShare: number): LoggedRun => ({
  seed: winner + 10,
  beta: 0.35,
  trades: 100_000,
  wealth: new Float64Array([topShare, 1 - topShare]),
  winner,
  topShare,
});

describe('interpretRuns', () => {
  it('withholds interpretation until a room has finished', () => {
    expect(interpretRuns([])).toBeNull();
  });

  it('reports the actual latest result', () => {
    expect(interpretRuns([run(1, 0.47)])).toMatchObject({
      latest: { winner: 1, topShare: 0.47 },
      winnerChange: 'first',
    });
  });

  it('treats a repeated winner as an authentic outcome', () => {
    expect(interpretRuns([run(1, 0.6), run(1, 0.52)])?.winnerChange).toBe('same');
    expect(interpretRuns([run(1, 0.6), run(0, 0.52)])?.winnerChange).toBe('different');
  });
});

import { describe, expect, it } from 'vitest';
import { assignShapes, headlineFor, TRAIT_SHAPES } from './traits';
import { completedRoomRun } from './roomRun';
import { REVEAL_SEED, REVEAL_TRADES, WINNER_FIRST_SEED, WINNER_RERUN_SEED } from './presets';

describe('assignShapes', () => {
  it('deals shapes round-robin, fixed before any run', () => {
    const shapes = assignShapes(14);
    expect(shapes[0]).toBe('square');
    expect(shapes[6]).toBe('square');
    expect(shapes[13]).toBe(TRAIT_SHAPES[13 % 6]);
  });
});

describe('headlineFor', () => {
  it('has confident copy for every shape and variant', () => {
    for (const shape of TRAIT_SHAPES) {
      for (const run of [0, 1, 2]) {
        const h = headlineFor(shape, run);
        expect(h.text.length).toBeGreaterThan(4);
        expect(h.source.length).toBeGreaterThan(4);
      }
    }
  });
});

describe('curated presets', () => {
  it('keeps the reveal run dramatic: one enormous, the rest dust', () => {
    const run = completedRoomRun(REVEAL_SEED, REVEAL_TRADES);
    expect(run.topShare).toBeGreaterThan(0.6);
    const sorted = Float64Array.from(run.wealth).sort().reverse();
    expect(sorted[1] / sorted[0]).toBeLessThan(0.2);
  });

  it("makes the first winner-story run crown a square, the rerun a hexagon", () => {
    const shapes = assignShapes(100);
    const first = completedRoomRun(WINNER_FIRST_SEED, REVEAL_TRADES);
    expect(shapes[first.winner]).toBe('square');
    const rerun = completedRoomRun(WINNER_RERUN_SEED, REVEAL_TRADES);
    expect(shapes[rerun.winner]).toBe('hexagon');
  });
});

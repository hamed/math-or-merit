import { describe, expect, it } from 'vitest';
import {
  createBaselineWorlds,
  resetBaselineWorlds,
  stepBaselineWorlds,
  viewBaselineWorlds,
} from './BaselineWorlds';

describe('baseline explorable worlds', () => {
  it('starts several seeded worlds from equality', () => {
    const views = viewBaselineWorlds(createBaselineWorlds({ n: 10, beta: 0.5, seeds: [1, 2, 3] }));
    expect(views.map(({ seed }) => seed)).toEqual([1, 2, 3]);
    for (const view of views) {
      expect(view.step).toBe(0);
      expect(view.gini).toBe(0);
      expect(view.topShare).toBeCloseTo(0.1);
    }
  });

  it('advances worlds together while their trajectories diverge', () => {
    const worlds = createBaselineWorlds({ n: 20, beta: 0.5, seeds: [1, 2, 3] });
    stepBaselineWorlds(worlds, 1_000);
    const views = viewBaselineWorlds(worlds);

    expect(views.map(({ step }) => step)).toEqual([1_000, 1_000, 1_000]);
    expect(new Set(views.map(({ topShare }) => topShare)).size).toBeGreaterThan(1);
  });

  it('replays the same trajectories after reset', () => {
    const worlds = createBaselineWorlds({ n: 20, beta: 0.5, seeds: [7, 8] });
    stepBaselineWorlds(worlds, 500);
    const first = viewBaselineWorlds(worlds);
    resetBaselineWorlds(worlds);
    stepBaselineWorlds(worlds, 500);

    expect(viewBaselineWorlds(worlds)).toEqual(first);
  });
});

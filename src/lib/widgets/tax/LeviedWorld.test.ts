import { describe, expect, it } from 'vitest';
import { giniCoefficient } from '$lib/research';
import { LeviedWorld } from './LeviedWorld';

const total = (w: Float64Array) => w.reduce((a, b) => a + b, 0);

describe('LeviedWorld', () => {
  it('conserves total wealth with trades and periodic levies', () => {
    const world = new LeviedWorld({ n: 60, beta: 0.2, taxRate: 0.05, levyEvery: 60, seed: 5 });
    world.step(20_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('equalizes geometrically from an unequal start when trading is off', () => {
    const initial = [0.7, 0.1, 0.1, 0.05, 0.05];
    const world = new LeviedWorld({ n: 5, beta: 0, taxRate: 0.1, levyEvery: 1, initialWealth: initial });
    const g0 = giniCoefficient(world.wealth);
    world.step(1);
    const g1 = giniCoefficient(world.wealth);
    // one flat levy shrinks every deviation from the mean by exactly (1 - rate)
    expect(g1).toBeCloseTo(g0 * 0.9, 9);
    world.step(60);
    expect(giniCoefficient(world.wealth)).toBeLessThan(0.005);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('normalizes the initial snapshot and resets to it', () => {
    const world = new LeviedWorld({ n: 3, beta: 0, taxRate: 0.5, levyEvery: 1, initialWealth: [2, 1, 1] });
    expect(total(world.wealth)).toBeCloseTo(1, 12);
    expect(world.wealth[0]).toBeCloseTo(0.5, 12);
    world.step(5);
    world.reset();
    expect(world.wealth[0]).toBeCloseTo(0.5, 12);
    expect(world.ticks).toBe(0);
  });

  it('replays identically from the same seed', () => {
    const a = new LeviedWorld({ n: 20, beta: 0.3, taxRate: 0.02, levyEvery: 20, seed: 42 });
    const b = new LeviedWorld({ n: 20, beta: 0.3, taxRate: 0.02, levyEvery: 20, seed: 42 });
    a.step(5000);
    b.step(5000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
  });
});

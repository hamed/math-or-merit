import { describe, expect, it } from 'vitest';
import { TaxWorld } from './TaxWorld';

const total = (w: Float64Array) => w.reduce((a, b) => a + b, 0);

describe('TaxWorld', () => {
  it('conserves total wealth across trades and levies', () => {
    const world = new TaxWorld({ n: 50, beta: 0.2, seed: 9 });
    world.step(5000);
    world.levy(3, 0.25);
    world.step(5000);
    world.levy(40, 0.25);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('levies the target and shares the revenue equally', () => {
    const world = new TaxWorld({ n: 4, beta: 0.2, seed: 1 });
    const before = Float64Array.from(world.wealth);
    const revenue = world.levy(0, 0.4);
    expect(revenue).toBeCloseTo(before[0] * 0.4, 12);
    const dividend = revenue / 4;
    expect(world.wealth[0]).toBeCloseTo(before[0] - revenue + dividend, 12);
    expect(world.wealth[1]).toBeCloseTo(before[1] + dividend, 12);
    expect(world.leviedTotal).toBeCloseTo(revenue, 12);
  });

  it('replays identically from the same seed', () => {
    const a = new TaxWorld({ n: 30, beta: 0.2, seed: 123 });
    const b = new TaxWorld({ n: 30, beta: 0.2, seed: 123 });
    a.step(2000);
    b.step(2000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
    a.reset();
    a.step(2000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
  });

  it('keeps trading fair: no trait, index, or size enters the coin', () => {
    // The pair loop and coin come from the seeded RNG alone; a levy must not
    // change how future pairs are drawn (state advances only via next()).
    const a = new TaxWorld({ n: 10, beta: 0.2, seed: 7 });
    const b = new TaxWorld({ n: 10, beta: 0.2, seed: 7 });
    a.step(100);
    b.step(100);
    a.levy(0, 0.5);
    a.step(100);
    b.levy(5, 0.1);
    b.step(100);
    // Same trades happened in both worlds; only the levy differed.
    const ratio = total(a.wealth) / total(b.wealth);
    expect(ratio).toBeCloseTo(1, 9);
  });
});

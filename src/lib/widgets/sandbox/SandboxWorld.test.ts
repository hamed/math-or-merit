import { describe, expect, it } from 'vitest';
import { SandboxWorld } from './SandboxWorld';

const total = (w: Float64Array) => w.reduce((a, b) => a + b, 0);

describe('SandboxWorld', () => {
  it('keeps shares summing to 1 under trades with flat levies', () => {
    const world = new SandboxWorld({ n: 50, seed: 5, startDollars: 100 });
    world.beta = 0.25;
    world.taxMode = 'flat';
    world.flatRate = 0.05;
    world.taxEvery = 50;
    world.step(20_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    expect(world.totalDollars).toBe(50 * 100); // no interest: total unchanged
  });

  it('keeps shares summing to 1 under progressive levies', () => {
    const world = new SandboxWorld({ n: 40, seed: 9, startDollars: 100 });
    world.beta = 0.3;
    world.taxMode = 'progressive';
    world.brackets = [
      { above: 200, rate: 0.1 },
      { above: 1000, rate: 0.3 },
    ];
    world.taxEvery = 40;
    world.step(15_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('computes progressive liabilities on dollars, matching hand math', () => {
    // 4 agents; totals: $400. Shares 0.5/0.25/0.125/0.125 → $200/$100/$50/$50.
    const world = new SandboxWorld({ n: 4, seed: 1, startDollars: 100 });
    world.wealth.set([0.5, 0.25, 0.125, 0.125]);
    world.taxMode = 'progressive';
    world.brackets = [{ above: 150, rate: 0.2 }]; // only the $200 agent owes: (200-150)·0.2 = $10
    world.taxEvery = 1;
    world.beta = 0; // isolate the levy
    world.step(1);
    expect(world.leviedDollars).toBeCloseTo(10, 9);
    // $10 collected from agent 0, $2.50 dividend each
    expect(world.dollarsOf(0)).toBeCloseTo(200 - 10 + 2.5, 9);
    expect(world.dollarsOf(1)).toBeCloseTo(100 + 2.5, 9);
    expect(total(world.wealth)).toBeCloseTo(1, 12);
  });

  it('interest grows the total geometrically and leaves shares untouched', () => {
    const world = new SandboxWorld({ n: 10, seed: 2, startDollars: 100 });
    world.beta = 0;
    world.interestRate = 0.1;
    world.interestEvery = 10;
    const sharesBefore = Array.from(world.wealth);
    world.step(30); // three interest events
    expect(world.totalDollars).toBeCloseTo(1000 * 1.1 ** 3, 9);
    expect(Array.from(world.wealth)).toEqual(sharesBefore);
  });

  it('a growing total pushes agents across dollar thresholds', () => {
    // Nobody owes at $1000 total; after interest doubles the total, the top
    // agent crosses the $250 threshold and the levy starts collecting.
    const make = () => {
      const w = new SandboxWorld({ n: 5, seed: 3, startDollars: 100 }); // $500 total
      w.wealth.set([0.4, 0.15, 0.15, 0.15, 0.15]); // top holds $200
      w.beta = 0;
      w.taxMode = 'progressive';
      w.brackets = [{ above: 250, rate: 0.5 }];
      w.taxEvery = 5;
      return w;
    };
    const flat = make();
    flat.step(5);
    expect(flat.leviedDollars).toBe(0);

    const growing = make();
    growing.interestRate = 1; // doubles the total
    growing.interestEvery = 1;
    growing.step(5); // interest fires before the tick-5 levy → top ≈ $400+
    expect(growing.leviedDollars).toBeGreaterThan(0);
  });

  it('resets to the equal start and the starting total', () => {
    const world = new SandboxWorld({ n: 8, seed: 4, startDollars: 100 });
    world.beta = 0.4;
    world.interestRate = 0.05;
    world.interestEvery = 8;
    world.step(5000);
    world.reset();
    expect(world.trades).toBe(0);
    expect(world.totalDollars).toBe(800);
    expect(Array.from(world.wealth)).toEqual(new Array(8).fill(1 / 8));
  });
});

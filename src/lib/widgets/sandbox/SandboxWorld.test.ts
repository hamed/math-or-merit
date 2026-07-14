import { describe, expect, it } from 'vitest';
import { RoundSeries, SandboxWorld, TRACKED_AGENTS } from './SandboxWorld';

const total = (w: Float64Array) => w.reduce((a, b) => a + b, 0);

describe('RoundSeries', () => {
  it('keeps every round while small, anchored at round 1', () => {
    const s = new RoundSeries();
    for (let r = 1; r <= 5; r++) s.push(r);
    expect(s.values).toEqual([1, 2, 3, 4, 5]);
    expect(s.stride).toBe(1);
    expect(s.roundOf(0)).toBe(1);
    expect(s.roundOf(4)).toBe(5);
  });

  it('halves by averaging pairs when full — history keeps its whole shape', () => {
    const s = new RoundSeries();
    for (let r = 0; r < 2048; r++) s.push(r);
    // two halvings: 1024 → 512 (+ new points at stride 4)
    expect(s.stride).toBe(4);
    expect(s.values.length).toBeLessThan(1024);
    expect(s.values[0]).toBeCloseTo((0 + 1 + 2 + 3) / 4, 9); // first 4 rounds averaged
    expect(s.roundOf(0)).toBe(4);
  });
});

describe('SandboxWorld', () => {
  it('keeps shares summing to 1 under trades with a flat levy', () => {
    const world = new SandboxWorld({ n: 50, seed: 5, startDollars: 100 });
    world.beta = 0.25;
    world.taxRate = 0.05;
    world.taxEvery = 50;
    world.step(20_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    expect(world.totalDollars).toBe(50 * 100); // levies redistribute; total unchanged
  });

  it('survives the sandbox extremes: 100% stake and 100% tax', () => {
    const world = new SandboxWorld({ n: 20, seed: 7, startDollars: 100 });
    world.beta = 1;
    world.taxRate = 1;
    world.taxEvery = 20;
    world.step(5_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    for (const w of world.wealth) expect(Number.isFinite(w)).toBe(true);
  });

  it('records one point per round in every series, anchored at round 1', () => {
    const world = new SandboxWorld({ n: 10, seed: 3, startDollars: 100 });
    world.beta = 0.2;
    world.taxEvery = 10;
    world.step(50); // 5 rounds
    expect(world.rounds).toBe(5);
    expect(world.giniSeries.values.length).toBe(5);
    expect(world.topShareSeries.values.length).toBe(5);
    expect(world.volumeSeries.values.length).toBe(5);
    expect(world.agentSeries.length).toBe(TRACKED_AGENTS);
    expect(world.agentSeries[0].values.length).toBe(5);
    expect(world.giniSeries.values.every((g) => g > 0 && g < 1)).toBe(true);
    expect(world.volumeSeries.values.every((d) => d > 0)).toBe(true);
  });

  it('volume is the won money: the first equal-start trade moves exactly β·(total/n)', () => {
    // 10 agents × $100: first trade transfer = 0.2 × min(share) × total = $20
    const world = new SandboxWorld({ n: 10, seed: 8, startDollars: 100 });
    world.beta = 0.2;
    world.taxEvery = 1; // one series point per trade
    world.step(1);
    expect(world.volumeSeries.values[0]).toBeCloseTo(20, 9);
  });

  it('tracked-agent trajectories conserve the room total at equal start', () => {
    const world = new SandboxWorld({ n: 100, seed: 11, startDollars: 100 });
    world.beta = 0;
    world.taxEvery = 100;
    world.step(100); // one no-trade round
    for (const s of world.agentSeries) expect(s.values[0]).toBeCloseTo(100, 9);
  });

  it('levyAgent takes the slice from one agent and returns equal dividends', () => {
    // 4 agents, $400 total, shares 0.5/0.25/0.125/0.125 → $200/$100/$50/$50.
    const world = new SandboxWorld({ n: 4, seed: 1, startDollars: 100 });
    world.wealth.set([0.5, 0.25, 0.125, 0.125]);
    const revenue = world.levyAgent(0, 0.2); // 20% of $200 = $40, $10 dividend each
    expect(revenue).toBeCloseTo(40, 9);
    expect(world.dollarsOf(0)).toBeCloseTo(200 - 40 + 10, 9);
    expect(world.dollarsOf(1)).toBeCloseTo(100 + 10, 9);
    expect(total(world.wealth)).toBeCloseTo(1, 12);
    expect(world.leviedDollars).toBeCloseTo(40, 9);
  });

  it('handles the tiniest room: n = 2 with fewer tracked agents than TRACKED_AGENTS', () => {
    const world = new SandboxWorld({ n: 2, seed: 9, startDollars: 100 });
    world.beta = 0.5;
    world.taxEvery = 2;
    world.step(200);
    expect(world.agentSeries.length).toBe(2);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('resets to the equal start, the starting total, and empty series', () => {
    const world = new SandboxWorld({ n: 8, seed: 4, startDollars: 250 });
    world.beta = 0.4;
    world.taxRate = 0.05;
    world.taxEvery = 8;
    world.step(5000);
    world.levyAgent(0, 0.1);
    world.reset();
    expect(world.trades).toBe(0);
    expect(world.rounds).toBe(0);
    expect(world.totalDollars).toBe(8 * 250);
    expect(world.leviedDollars).toBe(0);
    expect(world.giniSeries.values.length).toBe(0);
    expect(world.volumeSeries.values.length).toBe(0);
    expect(Array.from(world.wealth)).toEqual(new Array(8).fill(1 / 8));
  });
});

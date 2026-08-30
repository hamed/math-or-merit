import { describe, expect, it } from 'vitest';
import { giniCoefficient } from '$lib/research';
import { measureToy, RoundSeries, SandboxWorld, TRACKED_AGENTS } from './SandboxWorld';

const total = (w: Float64Array) => w.reduce((a, b) => a + b, 0);

describe('measureToy', () => {
  it('reports the effective-participant endpoints', () => {
    expect(measureToy([1, 1, 1, 1]).effectiveParticipants).toBeCloseTo(4, 12);
    expect(measureToy([4, 0, 0, 0]).effectiveParticipants).toBeCloseTo(1, 12);
  });

  it('is scale invariant', () => {
    expect(measureToy([1, 2, 3]).effectiveParticipants)
      .toBeCloseTo(measureToy([10, 20, 30]).effectiveParticipants, 12);
  });
});

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

  it('keeps post-compaction samples aligned with their represented rounds', () => {
    const s = new RoundSeries();
    for (let round = 1; round <= 3072; round++) s.push(round);
    expect(s.stride).toBe(4);
    expect(s.values).toHaveLength(768);
    expect(s.values[512]).toBeCloseTo((2049 + 2050 + 2051 + 2052) / 4, 9);
    expect(s.roundOf(512)).toBe(2052);
    expect(s.roundOf(s.values.length - 1)).toBe(3072);
  });

  it('does not label a partial stride bucket as a completed round', () => {
    const s = new RoundSeries();
    for (let round = 1; round <= 2051; round++) s.push(round);
    expect(s.stride).toBe(4);
    expect(s.values).toHaveLength(512);
    expect(s.roundOf(s.values.length - 1)).toBe(2048);
  });
});

describe('SandboxWorld', () => {
  it('keeps shares summing to 1 under trades with a flat levy', () => {
    const world = new SandboxWorld({ n: 50, seed: 5, startDollars: 100 });
    world.beta = 0.25;
    world.taxRate = 0.05;
    world.tradesPerRound = 50;
    world.step(20_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    expect(world.totalDollars).toBe(50 * 100); // levies redistribute; total unchanged
  });

  it('survives the sandbox extremes: 100% stake and 100% tax', () => {
    const world = new SandboxWorld({ n: 20, seed: 7, startDollars: 100 });
    world.beta = 1;
    world.taxRate = 1;
    world.tradesPerRound = 20;
    world.step(5_000);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    for (const w of world.wealth) expect(Number.isFinite(w)).toBe(true);
  });

  it('records one point per round in every series, anchored at round 1', () => {
    const world = new SandboxWorld({ n: 10, seed: 3, startDollars: 100 });
    world.beta = 0.2;
    world.tradesPerRound = 10;
    world.step(50); // 5 rounds
    expect(world.rounds).toBe(5);
    expect(world.giniSeries.values.length).toBe(5);
    expect(world.topShareSeries.values.length).toBe(5);
    expect(world.tradeVolumeSeries.values.length).toBe(5);
    expect(world.agentSeries.length).toBe(TRACKED_AGENTS);
    expect(world.agentSeries[0].values.length).toBe(5);
    expect(world.giniSeries.values.every((g) => g > 0 && g < 1)).toBe(true);
    expect(world.tradeVolumeSeries.values.every((d) => d > 0)).toBe(true);
  });

  it('volume is the won money: the first equal-start trade moves exactly β·(total/n)', () => {
    // 10 agents × $100: first trade transfer = 0.2 × min(share) × total = $20
    const world = new SandboxWorld({ n: 10, seed: 8, startDollars: 100 });
    world.beta = 0.2;
    world.tradesPerRound = 1; // one series point per trade
    world.step(1);
    expect(world.tradeVolumeSeries.values[0]).toBeCloseTo(20, 9);
    expect(world.wealthTurnoverSeries.values[0]).toBeCloseTo(0.02, 12);
  });

  it('normalizes turnover across rooms with different starting-dollar totals', () => {
    const make = (startDollars: number) => {
      const world = new SandboxWorld({ n: 10, seed: 8, startDollars });
      world.beta = 0.2;
      world.tradesPerRound = 1;
      world.step(1);
      return world;
    };
    const small = make(100);
    const large = make(250);
    expect(large.tradeVolumeSeries.values[0]).toBeCloseTo(small.tradeVolumeSeries.values[0] * 2.5, 12);
    expect(large.wealthTurnoverSeries.values[0]).toBeCloseTo(small.wealthTurnoverSeries.values[0], 12);
  });

  it('records zero ordinary turnover at zero stake', () => {
    const world = new SandboxWorld({ n: 10, seed: 8, startDollars: 100 });
    world.beta = 0;
    world.tradesPerRound = 10;
    world.step(10);
    expect(world.tradeVolumeSeries.values[0]).toBe(0);
    expect(world.wealthTurnoverSeries.values[0]).toBe(0);
  });

  it('keeps structural levy flow out of ordinary turnover', () => {
    const world = new SandboxWorld({ n: 10, seed: 8, startDollars: 100 });
    world.beta = 0;
    world.taxRate = 0.1;
    world.tradesPerRound = 10;
    world.step(10);
    expect(world.tradeVolumeSeries.values[0]).toBe(0);
    expect(world.wealthTurnoverSeries.values[0]).toBe(0);
    expect(world.levyFlowSeries.values[0]).toBeCloseTo(100, 9);
  });

  it('accounts for manual and structural levy flow in the same measurement bucket', () => {
    const world = new SandboxWorld({ n: 4, seed: 1, startDollars: 100 });
    world.beta = 0;
    world.taxRate = 0.1;
    world.tradesPerRound = 4;
    expect(world.levyAgent(0, 0.2)).toBeCloseTo(20, 9);
    world.step(4);
    expect(world.levyFlowSeries.values[0]).toBeCloseTo(60, 9);
    expect(world.leviedDollars).toBeCloseTo(60, 9);
  });

  it('keeps measurement cadence independent from levy cadence', () => {
    const world = new SandboxWorld({ n: 4, seed: 1, startDollars: 100 });
    world.beta = 0;
    world.taxRate = 0.1;
    world.tradesPerRound = 4;
    world.levyEveryRounds = 3;
    world.step(8);
    expect(world.rounds).toBe(2);
    expect(world.levyFlowSeries.values).toEqual([0, 0]);
    world.step(4);
    expect(world.rounds).toBe(3);
    expect(world.levyFlowSeries.values[2]).toBeCloseTo(40, 9);
  });

  it('tracked-agent trajectories conserve the room total at equal start', () => {
    const world = new SandboxWorld({ n: 100, seed: 11, startDollars: 100 });
    world.beta = 0;
    world.tradesPerRound = 100;
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

  it('expert chaos: a 150% stake conserves the total while it stays finite', () => {
    const world = new SandboxWorld({ n: 6, seed: 12, startDollars: 100 });
    world.beta = 1.5; // loser goes NEGATIVE — deliberately allowed
    world.tradesPerRound = 6;
    world.step(30);
    expect(total(world.wealth)).toBeCloseTo(1, 6);
    expect(Array.from(world.wealth).some((w) => w < 0)).toBe(true);
  });

  it('expert chaos: a negative tax is a wealth-proportional subsidy, still conserving', () => {
    const world = new SandboxWorld({ n: 5, seed: 13, startDollars: 100 });
    world.wealth.set([0.4, 0.3, 0.15, 0.1, 0.05]);
    world.beta = 0;
    world.taxRate = -0.1; // the rich get 10% richer, financed equally by all
    world.tradesPerRound = 5;
    world.step(5);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
    expect(world.wealth[0]).toBeGreaterThan(0.4); // richest gained
    expect(world.wealth[4]).toBeLessThan(0.05); // poorest paid
    expect(world.leviedDollars).toBeLessThan(0);
  });

  it('handles the tiniest room: n = 2 with fewer tracked agents than TRACKED_AGENTS', () => {
    const world = new SandboxWorld({ n: 2, seed: 9, startDollars: 100 });
    world.beta = 0.5;
    world.tradesPerRound = 2;
    world.step(200);
    expect(world.agentSeries.length).toBe(2);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('lets expert rooms use zero or negative starting dollars', () => {
    for (const startDollars of [0, -100]) {
      const world = new SandboxWorld({ n: 4, seed: 9, startDollars });
      world.step(40);
      expect(world.totalDollars).toBe(4 * startDollars);
      expect(Array.from(world.wealth).every(Number.isFinite)).toBe(true);
      world.reset();
      expect(world.totalDollars).toBe(4 * startDollars);
    }
  });

  it('owns an immutable configuration snapshot', () => {
    const config = { n: 4, seed: 5, startDollars: 100 };
    const world = new SandboxWorld(config);
    config.n = 20;
    config.startDollars = -500;
    world.step(40);
    world.reset();
    expect(world.config).not.toBe(config);
    expect(Object.isFrozen(world.config)).toBe(true);
    expect(world.wealth).toHaveLength(4);
    expect(world.totalDollars).toBe(400);
  });

  it('resets to the equal start, the starting total, and empty series', () => {
    const world = new SandboxWorld({ n: 8, seed: 4, startDollars: 250 });
    world.beta = 0.4;
    world.taxRate = 0.05;
    world.tradesPerRound = 8;
    world.step(5000);
    world.levyAgent(0, 0.1);
    world.reset();
    expect(world.trades).toBe(0);
    expect(world.rounds).toBe(0);
    expect(world.totalDollars).toBe(8 * 250);
    expect(world.leviedDollars).toBe(0);
    expect(world.giniSeries.values.length).toBe(0);
    expect(world.topShareSeries.values.length).toBe(0);
    expect(world.effectiveParticipantsSeries.values.length).toBe(0);
    expect(world.tradeVolumeSeries.values.length).toBe(0);
    expect(world.wealthTurnoverSeries.values.length).toBe(0);
    expect(world.levyFlowSeries.values.length).toBe(0);
    expect(world.agentSeries.every((series) => series.values.length === 0)).toBe(true);
    expect(Array.from(world.wealth)).toEqual(new Array(8).fill(1 / 8));
  });
});

/**
 * Absorbed from the retired LeviedWorld and TaxWorld (2026-08-27): those two
 * classes were the same machine as this one, and their guarantees have to
 * keep holding here — the phase map, the tax game and the tax-only demo all
 * run on SandboxWorld now.
 */
describe('SandboxWorld as the one world', () => {
  it('replays identically from the same seed, before and after a reset', () => {
    const make = () => {
      const w = new SandboxWorld({ n: 20, seed: 42, startDollars: 100 });
      w.beta = 0.3;
      w.taxRate = 0.02;
      w.tradesPerRound = 20;
      return w;
    };
    const a = make();
    const b = make();
    a.step(5000);
    b.step(5000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
    a.reset();
    a.step(5000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
  });

  it('keeps trading fair: no trait, index, or size enters the coin', () => {
    // The pair loop and coin come from the seeded RNG alone; a levy must not
    // change how future pairs are drawn (state advances only via next()).
    const make = () => {
      const w = new SandboxWorld({ n: 10, seed: 7, startDollars: 100 });
      w.beta = 0.2;
      w.tradesPerRound = 10;
      return w;
    };
    const a = make();
    const b = make();
    a.step(100);
    b.step(100);
    a.levyAgent(0, 0.5);
    a.step(100);
    b.levyAgent(5, 0.1);
    b.step(100);
    // Same trades happened in both worlds; only the levy differed.
    expect(total(a.wealth) / total(b.wealth)).toBeCloseTo(1, 9);
  });

  it('equalizes geometrically from an unequal start when trading is off', () => {
    const world = new SandboxWorld({
      n: 5,
      startDollars: 100,
      initialWealth: [0.7, 0.1, 0.1, 0.05, 0.05],
    });
    world.beta = 0;
    world.taxRate = 0.1;
    world.tradesPerRound = 1;
    const g0 = giniCoefficient(world.wealth);
    world.step(1);
    // one flat levy shrinks every deviation from the mean by exactly (1 - rate)
    expect(giniCoefficient(world.wealth)).toBeCloseTo(g0 * 0.9, 9);
    world.step(60);
    expect(giniCoefficient(world.wealth)).toBeLessThan(0.005);
    expect(total(world.wealth)).toBeCloseTo(1, 9);
  });

  it('normalizes an unequal start and resets back to it', () => {
    const world = new SandboxWorld({ n: 3, startDollars: 100, initialWealth: [2, 1, 1] });
    expect(total(world.wealth)).toBeCloseTo(1, 12);
    expect(world.wealth[0]).toBeCloseTo(0.5, 12);
    world.beta = 0;
    world.taxRate = 0.5;
    world.tradesPerRound = 1;
    world.step(5);
    world.reset();
    expect(world.wealth[0]).toBeCloseTo(0.5, 12);
    expect(world.trades).toBe(0);
  });

  it('rejects a corrupt initial room instead of letting it poison the world', () => {
    const bad = (initialWealth: number[]) =>
      () => new SandboxWorld({ n: initialWealth.length, startDollars: 100, initialWealth });
    expect(() => new SandboxWorld({ n: 3, startDollars: 100, initialWealth: [1, 1] })).toThrow(RangeError);
    expect(bad([0, 0, 0])).toThrow(RangeError); // nothing to normalize against
    expect(bad([2, -1, 1])).toThrow(RangeError); // used to survive as a negative share
    expect(bad([Infinity, 1, 1])).toThrow(RangeError); // used to normalize to [NaN, 0, 0]
    expect(bad([Number.NaN, 1, 1])).toThrow(RangeError);
  });
});

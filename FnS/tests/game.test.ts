import { describe, expect, it } from 'vitest';
import { Game } from '../stage/core/game.ts';
import { Rng } from '../stage/core/rng.ts';
import { statsOf } from '../stage/core/stats.ts';

const sum = (w: ArrayLike<number>) => Array.from(w).reduce((a, b) => a + b, 0);

describe('game', () => {
  it('starts equal with total 1 and conserves it through trades, levies and gifts', () => {
    const g = new Game(50, 3);
    expect(g.wealth.every((w) => w === 1 / 50)).toBe(true);
    g.trade(20_000);
    expect(Math.abs(sum(g.wealth) - 1)).toBeLessThan(1e-12);
    g.levy(0.3);
    g.give(0, 1, 0.5);
    expect(Math.abs(sum(g.wealth) - 1)).toBeLessThan(1e-12);
    expect(g.wealth.every((w) => w > 0)).toBe(true);
  });

  it('is deterministic per seed and replays after reset', () => {
    const a = new Game(30, 7);
    const b = new Game(30, 7);
    a.trade(5000);
    b.trade(2000);
    b.trade(3000);
    expect(Array.from(a.wealth)).toEqual(Array.from(b.wealth));
    const once = a.wealth.slice();
    a.reset();
    a.trade(5000);
    expect(Array.from(a.wealth)).toEqual(Array.from(once));
    expect(Array.from(new Game(30, 8).wealth)).toEqual(Array.from(new Game(30, 7).wealth));
  });

  it('uses the master generator: mulberry32 stream matches the reference values', () => {
    // reference: src/lib/sim/Random.ts with seed 1
    const r = new Rng(1);
    const first = [r.next(), r.next(), r.next()];
    expect(first[0]).toBeCloseTo(0.6270739405881613, 15);
    expect(first[1]).toBeCloseTo(0.002735721180215478, 15);
    expect(first[2]).toBeCloseTo(0.5274470399599522, 15);
  });

  it("replays the master's YardSaleEngine trade for trade", () => {
    // reference: createEngine({ n: 30, beta: 0.2, seed: 9 }).step(5000), computed from src/lib/sim
    const g = new Game(30, 9);
    g.trade(5000);
    expect(g.wealth[0]).toBe(0.003636641393152058);
    expect(g.wealth[29]).toBe(0.019030243039072553);
  });

  it('concentrates wealth under the yard sale and spreads it under a tax', () => {
    const free = new Game(100, 1);
    free.trade(100 * 400);
    const taxed = new Game(100, 1, { beta: 0.2, tax: 0.05 });
    taxed.trade(100 * 400);
    expect(statsOf(free.wealth).gini).toBeGreaterThan(0.6);
    expect(statsOf(taxed.wealth).gini).toBeLessThan(statsOf(free.wealth).gini - 0.2);
  });

  it('rejects bad input without changing anything', () => {
    const g = new Game(10, 1);
    g.trade(100);
    const before = g.wealth.slice();
    expect(() => g.trade(-1)).toThrow();
    expect(() => g.trade(1.5)).toThrow();
    expect(() => g.give(0, 10, 0.1)).toThrow();
    expect(() => g.give(0, 1, -1)).toThrow();
    expect(() => g.levy(2)).toThrow();
    expect(() => g.setRules({ beta: 1, tax: 0 })).toThrow();
    expect(Array.from(g.wealth)).toEqual(Array.from(before));
  });

  it('a gift never empties the giver', () => {
    const g = new Game(4, 1);
    g.give(0, 1, 1);
    expect(g.wealth[0]).toBeGreaterThan(0);
  });

  it('a round pairs everyone off: each trades at most once, and the total is kept', () => {
    const g = new Game(11, 3);
    const seen = new Map<number, number>();
    g.onMoves = (_kind, moves) => {
      for (const { from, to } of moves) {
        seen.set(to, (seen.get(to) ?? 0) + 1);
        seen.set(from, (seen.get(from) ?? 0) + 1);
      }
    };
    g.round();
    expect(g.trades).toBe(5);
    for (const v of seen.values()) expect(v).toBe(1);
    expect(seen.size).toBeLessThanOrEqual(10);
    g.onMoves = null;
    g.round(100);
    expect(Math.abs(Array.from(g.wealth).reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-12);
  });
});

import { describe, it, expect } from 'vitest';
import { createEngine } from './index';

describe('YardSaleEngine', () => {
  it.each([
    [{ n: 1, beta: 0.5 }, 'n'],
    [{ n: 2.5, beta: 0.5 }, 'n'],
    [{ n: 10, beta: -0.1 }, 'beta'],
    [{ n: 10, beta: 1.1 }, 'beta'],
    [{ n: 10, beta: Number.NaN }, 'beta'],
    [{ n: 10, beta: 0.5, seed: -1 }, 'seed'],
    [{ n: 10, beta: 0.5, seed: 2 ** 32 }, 'seed'],
    [{ n: 10, beta: 0.5, seed: 1.5 }, 'seed'],
  ])('rejects invalid config %o', (config, parameter) => {
    expect(() => createEngine(config)).toThrow(parameter);
  });

  it('takes an immutable snapshot of its config', () => {
    const config = { n: 10, beta: 0.5 };
    const eng = createEngine(config);
    config.n = 20;

    expect(eng.config).toEqual({ n: 10, beta: 0.5 });
    expect(Object.isFrozen(eng.config)).toBe(true);
  });

  it('initializes with equal wealth summing to 1', () => {
    const eng = createEngine({ n: 100, beta: 0.5 });
    const { wealth } = eng.state;
    const total = wealth.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(wealth[0]).toBeCloseTo(0.01, 10);
  });

  it('conserves total wealth after many steps', () => {
    const eng = createEngine({ n: 100, beta: 0.5 });
    eng.step(10_000);
    const total = eng.state.wealth.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 8);
  });

  it('increments step counter correctly', () => {
    const eng = createEngine({ n: 10, beta: 0.5 });
    eng.step(5);
    expect(eng.state.step).toBe(5);
    eng.step(3);
    expect(eng.state.step).toBe(8);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid step count of %s',
    (steps) => {
      const eng = createEngine({ n: 10, beta: 0.5 });
      expect(() => eng.step(steps)).toThrow('steps');
      expect(eng.state.step).toBe(0);
    },
  );

  it('reset restores equal wealth and zeroes step', () => {
    const eng = createEngine({ n: 10, beta: 0.5 });
    eng.step(100);
    eng.reset();
    expect(eng.state.step).toBe(0);
    const total = eng.state.wealth.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(eng.state.wealth[0]).toBeCloseTo(0.1, 10);
  });

  it('replays a seeded run after reset', () => {
    const eng = createEngine({ n: 10, beta: 0.5, seed: 42 });
    eng.step(100);
    const firstRun = Array.from(eng.state.wealth);

    eng.reset();
    eng.step(100);

    expect(Array.from(eng.state.wealth)).toEqual(firstRun);
  });

  it('produces the same trajectory for the same seed', () => {
    const first = createEngine({ n: 10, beta: 0.5, seed: 7 });
    const second = createEngine({ n: 10, beta: 0.5, seed: 7 });
    first.step(1_000);
    second.step(1_000);

    expect(Array.from(first.state.wealth)).toEqual(Array.from(second.state.wealth));
  });

  it('keeps beta zero at the equal initial state', () => {
    const eng = createEngine({ n: 10, beta: 0, seed: 1 });
    eng.step(10_000);
    expect(Array.from(eng.state.wealth)).toEqual(Array(10).fill(0.1));
  });

  it('is fair in expected wealth change over one trade', () => {
    let firstAgentWealth = 0;
    const runs = 10_000;
    for (let seed = 0; seed < runs; seed++) {
      const eng = createEngine({ n: 2, beta: 0.5, seed });
      eng.step();
      firstAgentWealth += eng.state.wealth[0];
    }
    expect(firstAgentWealth / runs).toBeCloseTo(0.5, 2);
  });

  it('never produces negative wealth', () => {
    const eng = createEngine({ n: 50, beta: 0.5 });
    eng.step(100_000);
    for (const w of eng.state.wealth) {
      expect(w).toBeGreaterThanOrEqual(0);
    }
  });
});

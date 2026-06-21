import { describe, it, expect } from 'vitest';
import { createEngine } from './index';

describe('YardSaleEngine', () => {
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

  it('reset restores equal wealth and zeroes step', () => {
    const eng = createEngine({ n: 10, beta: 0.5 });
    eng.step(100);
    eng.reset();
    expect(eng.state.step).toBe(0);
    const total = eng.state.wealth.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(eng.state.wealth[0]).toBeCloseTo(0.1, 10);
  });

  it('never produces negative wealth', () => {
    const eng = createEngine({ n: 50, beta: 0.5 });
    eng.step(100_000);
    for (const w of eng.state.wealth) {
      expect(w).toBeGreaterThanOrEqual(0);
    }
  });
});

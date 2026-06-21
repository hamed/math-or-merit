import { describe, expect, it } from 'vitest';
import { AdditiveExchangeEngine } from './additiveExchange';
import { advanceAffect, economicImpulse } from './affect';
import {
  applyFlatWealthBudget,
  applyFlatWealthLevy,
  applyProgressiveWealthBudget,
  applyProgressiveWealthLevy,
  applyTargetedWealthBudget,
  applyTargetedWealthLevy,
} from './interventions';
import { WeightedAccessYardSale } from './weightedAccess';

function sum(values: ArrayLike<number>): number {
  return Array.from(values).reduce((total, value) => total + value, 0);
}

describe('additional research models', () => {
  it('keeps random reshuffling non-negative and conservative', () => {
    const engine = new AdditiveExchangeEngine({ n: 100, seed: 8 });
    engine.step(100_000);
    expect(sum(engine.state.wealth)).toBeCloseTo(1);
    expect(Math.min(...engine.state.wealth)).toBeGreaterThanOrEqual(0);
  });

  it('keeps weighted access non-negative and conservative', () => {
    const engine = new WeightedAccessYardSale({ n: 30, beta: 0.5, seed: 8, accessExponent: 1 });
    engine.step(20_000);
    expect(sum(engine.state.wealth)).toBeCloseTo(1);
    expect(sum(engine.state.encounters)).toBe(40_000);
    expect(Math.min(...engine.state.wealth)).toBeGreaterThanOrEqual(0);
  });

  it('conserves wealth under each equal-dividend levy', () => {
    const targeted = new Float64Array([0.1, 0.2, 0.7]);
    const flat = targeted.slice();
    const progressive = targeted.slice();

    expect(applyTargetedWealthLevy(targeted, 2, 0.1)).toBeCloseTo(0.07);
    applyFlatWealthLevy(flat, 0.1, 0.15);
    applyProgressiveWealthLevy(progressive, [
      { above: 0, rate: 0 },
      { above: 0.2, rate: 0.1 },
      { above: 0.5, rate: 0.2 },
    ]);

    for (const values of [targeted, flat, progressive]) {
      expect(sum(values)).toBeCloseTo(1);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    }
  });

  it('matches collection budgets across incidence rules', () => {
    const targeted = new Float64Array([0.1, 0.2, 0.7]);
    const flat = targeted.slice();
    const progressive = targeted.slice();
    const budget = 0.05;

    expect(applyTargetedWealthBudget(targeted, 2, budget)).toBeCloseTo(budget);
    expect(applyFlatWealthBudget(flat, budget, 0.05)).toBeCloseTo(budget);
    expect(applyProgressiveWealthBudget(progressive, budget, [
      { above: 0, rate: 0.01 },
      { above: 0.2, rate: 0.1 },
    ])).toBeCloseTo(budget);
    for (const values of [targeted, flat, progressive]) expect(sum(values)).toBeCloseTo(1);
  });

  it('creates phasic display impulses that decay toward neutral', () => {
    const impulse = economicImpulse(-0.1, 0.2);
    expect(impulse).toEqual({ valence: -0.5, arousal: 0.5 });
    const peak = advanceAffect({ valence: 0, arousal: 0 }, 0, 1_000, impulse);
    const decayed = advanceAffect(peak, 1_000, 1_000);
    expect(Math.abs(decayed.valence)).toBeLessThan(Math.abs(peak.valence));
    expect(decayed.arousal).toBeLessThan(peak.arousal);
  });
});

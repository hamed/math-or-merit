import { describe, expect, it } from 'vitest';
import { ABSORB_BELOW, BIG, BITES, BITES_SECONDS, COINS, CROWD, RAIN, RAINED, SMALL } from './crowd';

describe("Scene 2's crowd", () => {
  it('rains sixteen coins at random: Red catches one, Blue at least one, some catch none', () => {
    expect(CROWD).toBe(16);
    expect(RAIN).toHaveLength(COINS);
    expect(RAINED.reduce((s, c) => s + c, 0)).toBe(16);
    expect(RAINED[SMALL]).toBe(1);
    expect(RAINED[BIG]).toBeGreaterThanOrEqual(1);
    expect(RAINED.filter((c) => c === 0).length).toBeGreaterThanOrEqual(3);
  });

  it('conserves every coin through every bump', () => {
    for (const bite of BITES) expect(bite.after.reduce((s, w) => s + w, 0)).toBe(16);
  });

  it('never breaks the rule: every stake is half of the smaller fortune', () => {
    let wealth = [...RAINED];
    for (const bite of BITES) {
      expect(bite.stake).toBe(Math.min(wealth[bite.a], wealth[bite.b]) / 2);
      wealth = [...bite.after];
    }
  });

  it('empties a fortune only once it has reached nothing', () => {
    let wealth = [...RAINED];
    for (const bite of BITES) {
      const loser = bite.winner === bite.a ? bite.b : bite.a;
      const left = wealth[loser] - bite.stake;
      expect(bite.absorbed === loser).toBe(left < ABSORB_BELOW);
      wealth = [...bite.after];
    }
  });

  it('ends at exactly 15 and 1, with everyone else at nothing', () => {
    const final = BITES[BITES.length - 1].after;
    expect(final[BIG]).toBe(15);
    expect(final[SMALL]).toBe(1);
    expect(final.filter((w, i) => i !== BIG && i !== SMALL).every((w) => w === 0)).toBe(true);
  });

  it('lets the trading pass Red by: he never bumps anyone', () => {
    expect(BITES.filter((bite) => bite.a === SMALL || bite.b === SMALL)).toEqual([]);
  });

  it('gets faster and faster, and is over in a few seconds', () => {
    for (let i = 2; i < BITES.length; i++) {
      expect(BITES[i].at - BITES[i - 1].at).toBeLessThanOrEqual(BITES[i - 1].at - BITES[i - 2].at + 1e-12);
    }
    expect(BITES_SECONDS).toBeLessThan(9);
  });
});

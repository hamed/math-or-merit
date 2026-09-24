import { describe, expect, it } from 'vitest';
import { ABSORB_BELOW, BIG, BITES, CROWD, SMALL } from './crowd';

describe("Scene 2's crowd", () => {
  it('starts as sixteen people with one coin each', () => {
    expect(CROWD).toBe(16);
  });

  it('conserves every coin through every bite', () => {
    for (const bite of BITES) expect(bite.after.reduce((s, w) => s + w, 0)).toBe(16);
  });

  it('never breaks the rule: every stake is half of the smaller fortune', () => {
    let wealth = new Array(CROWD).fill(1);
    for (const bite of BITES) {
      expect(bite.stake).toBe(Math.min(wealth[bite.a], wealth[bite.b]) / 2);
      wealth = [...bite.after];
    }
  });

  it('absorbs a circle only once it has reached nothing', () => {
    let wealth = new Array(CROWD).fill(1);
    for (const bite of BITES) {
      const loser = bite.winner === bite.a ? bite.b : bite.a;
      const left = wealth[loser] - bite.stake;
      expect(bite.absorbed === loser).toBe(left < ABSORB_BELOW);
      wealth = [...bite.after];
    }
  });

  it('ends at exactly 15 and 1, with everyone else absorbed', () => {
    const final = BITES[BITES.length - 1].after;
    expect(final[BIG]).toBe(15);
    expect(final[SMALL]).toBe(1);
    expect(final.filter((w, i) => i !== BIG && i !== SMALL).every((w) => w === 0)).toBe(true);
  });

  it('gets faster and faster', () => {
    for (let i = 2; i < BITES.length; i++) {
      expect(BITES[i].at - BITES[i - 1].at).toBeLessThanOrEqual(BITES[i - 1].at - BITES[i - 2].at + 1e-12);
    }
  });

  it('gives the small survivor exactly one win and one loss of the same stake', () => {
    const small = BITES.filter((bite) => bite.a === SMALL || bite.b === SMALL);
    expect(small).toHaveLength(2);
    expect(small[0].winner).toBe(SMALL);
    expect(small[1].winner).not.toBe(SMALL);
    expect(small[0].stake).toBe(small[1].stake);
  });
});

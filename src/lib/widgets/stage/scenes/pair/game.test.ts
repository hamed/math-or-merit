import { describe, expect, it } from 'vitest';
import { HOLDINGS, ROUNDS, UNITS } from './game';

// Moved here from beats.test.ts (2026-09-27) when the person scene lost its
// trade half: the coin game is Blue and Red's now, and these are its rules.
describe('the two-person coin game', () => {
  it('starts the two of them equal', () => {
    expect(HOLDINGS[0].a).toBe(UNITS / 2);
    expect(HOLDINGS[0].b).toBe(UNITS / 2);
  });

  it('makes and destroys no money', () => {
    for (const h of HOLDINGS) expect(h.a + h.b).toBe(UNITS);
  });

  it('stakes half of what the poorer one has, in whole coins', () => {
    ROUNDS.forEach((round, r) => {
      const { a, b } = HOLDINGS[r];
      expect(round.stake).toBe(Math.floor(Math.min(a, b) / 2));
      expect(round.stake).toBeGreaterThan(0);
    });
  });

  it('ends close enough to level to sell the illusion', () => {
    const last = HOLDINGS[HOLDINGS.length - 1];
    expect(Math.abs(last.a - last.b)).toBeLessThanOrEqual(UNITS / 4);
  });

  it('gives the first round to one of them and the rest to the other', () => {
    expect(ROUNDS[0].winner).not.toBe(ROUNDS[1].winner);
    expect(ROUNDS[1].winner).toBe(ROUNDS[2].winner);
  });
});

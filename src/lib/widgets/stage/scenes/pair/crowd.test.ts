import { describe, expect, it } from 'vitest';
import { BIG, BLUE_CATCHES, COINS, CROWD, DROPS, RAINED, RED_CATCHES, SMALL } from './crowd';

describe("Scene 2's crowd", () => {
  it('catches coins: Blue the most, Red the least of the two, everyone else one or two or none', () => {
    expect(CROWD).toBe(16);
    expect(RAINED[BIG]).toBe(15);
    expect(RAINED[SMALL]).toBe(1);
    expect(BLUE_CATCHES + RED_CATCHES).toBe(16);
    for (const [i, c] of RAINED.entries()) if (i !== BIG && i !== SMALL) expect(c).toBeLessThanOrEqual(2);
    expect(RAINED.filter((c) => c === 0).length).toBeGreaterThanOrEqual(3);
  });

  it('rains every coin exactly once, in drops: Blue\'s in bundles, everyone else\'s one by one', () => {
    const counts = new Array(CROWD).fill(0);
    for (const drop of DROPS) counts[drop.who] += drop.count;
    expect(counts).toEqual([...RAINED]);
    expect(DROPS.reduce((s, d) => s + d.count, 0)).toBe(COINS);
    for (const drop of DROPS) {
      if (drop.who === BIG) {
        expect(drop.count).toBeGreaterThanOrEqual(1);
        expect(drop.count).toBeLessThanOrEqual(4);
      } else expect(drop.count).toBe(1);
    }
    expect(DROPS.findIndex((d) => d.who === SMALL)).toBeLessThan(3);
  });
});

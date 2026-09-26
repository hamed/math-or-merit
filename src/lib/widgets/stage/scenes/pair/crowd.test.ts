import { describe, expect, it } from 'vitest';
import { BIG, BLUE_CATCHES, COINS, CROWD, RAIN, RAINED, RAIN_SECONDS, RED_CATCHES, SMALL } from './crowd';

describe("Scene 2's crowd", () => {
  it('catches coins: Blue the most, Red the least of the two, everyone else one or two or none', () => {
    expect(CROWD).toBe(16);
    expect(RAINED[BIG]).toBe(15);
    expect(RAINED[SMALL]).toBe(1);
    expect(BLUE_CATCHES + RED_CATCHES).toBe(16);
    for (const [i, c] of RAINED.entries()) if (i !== BIG && i !== SMALL) expect(c).toBeLessThanOrEqual(2);
    expect(RAINED.filter((c) => c === 0).length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...RAINED.filter((_, i) => i !== BIG))).toBeLessThan(RAINED[BIG]);
  });

  it('rains every coin exactly once, onto someone who catches it', () => {
    expect(RAIN).toHaveLength(COINS);
    const counts = new Array(CROWD).fill(0);
    for (const who of RAIN) counts[who] += 1;
    expect(counts).toEqual([...RAINED]);
  });

  it("spreads Blue's catches through the rain rather than in one run", () => {
    const blue = RAIN.map((who, k) => (who === BIG ? k : -1)).filter((k) => k >= 0);
    expect(blue[0]).toBeLessThan(RAIN.length / 3);
    expect(blue[blue.length - 1]).toBeGreaterThan((RAIN.length * 2) / 3);
  });

  it('is over in a few seconds', () => {
    expect(RAIN_SECONDS).toBeLessThan(7);
  });
});

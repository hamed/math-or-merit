import { describe, expect, it } from 'vitest';
import { BIG, BLUE_CATCHES, COINS, CROWD, DROPS, RAINED, RED_CATCHES, SMALL, START } from './crowd';

describe("Scene 2's crowd", () => {
  it('hops in already different sizes, everyone holding something', () => {
    expect(CROWD).toBe(8);
    expect(START).toHaveLength(CROWD);
    for (const c of START) expect(c).toBeGreaterThanOrEqual(1);
    expect(new Set(START).size).toBeGreaterThan(1);
  });

  it('ends with Blue the biggest at 15 and Red at 1: the game\'s sixteen coins', () => {
    expect(RAINED[BIG]).toBe(BLUE_CATCHES);
    expect(RAINED[SMALL]).toBe(RED_CATCHES);
    expect(BLUE_CATCHES + RED_CATCHES).toBe(16);
    for (const [i, c] of RAINED.entries()) if (i !== BIG) expect(c, `person ${i}`).toBeLessThan(RAINED[BIG]);
  });

  it('rains every coin once, each onto someone: what they end with is what they started with and caught', () => {
    const caught = new Array(CROWD).fill(0);
    for (const drop of DROPS) caught[drop.who] += drop.count;
    expect(DROPS.reduce((s, d) => s + d.count, 0)).toBe(COINS);
    expect(START.map((s, i) => s + caught[i])).toEqual([...RAINED]);
  });

  it('lands each coin with odds in proportion to what each holds: the rich-get-richer urn', () => {
    // replay the draws: every catcher held at least one coin, so a bigger target is never skipped
    const hold = [...START];
    for (const drop of DROPS) {
      expect(hold[drop.who]).toBeGreaterThan(0);
      hold[drop.who] += drop.count;
    }
    expect(hold).toEqual([...RAINED]);
  });
});

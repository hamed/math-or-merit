import { describe, expect, it } from 'vitest';
import { breath } from './ambient';

describe('breath', () => {
  it('stays small enough never to read as movement', () => {
    for (let t = 0; t < 60; t += 0.037) {
      const b = breath(t, 1);
      expect(Math.abs(b.dx)).toBeLessThanOrEqual(1);
      expect(Math.abs(b.dy)).toBeLessThanOrEqual(1.6);
      expect(Math.abs(b.scale - 1)).toBeLessThanOrEqual(0.02);
    }
  });

  it('never has two characters breathing in unison', () => {
    const apart = [0.5, 1.3, 2.9, 4.4].some((t) => breath(t, 0).dy !== breath(t, 1).dy);
    expect(apart).toBe(true);
  });

  it('is perfectly still when there is nothing to breathe', () => {
    expect(breath(3, 0, 0)).toEqual({ dx: 0, dy: 0, scale: 1 });
    expect(breath(Number.NaN, 0)).toEqual({ dx: 0, dy: 0, scale: 1 });
  });
});

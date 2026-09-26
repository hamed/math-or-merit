import { describe, expect, it } from 'vitest';
import { toDollars } from './binning';

describe('toDollars', () => {
  it('converts equal shares to the starting stake', () => {
    const dollars = toDollars(new Float64Array(4).fill(0.25), 100);
    expect(Array.from(dollars)).toEqual([100, 100, 100, 100]);
  });
});

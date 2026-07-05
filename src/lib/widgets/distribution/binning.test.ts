import { describe, expect, it } from 'vitest';
import { linearBins, logBins, toDollars } from './binning';

describe('toDollars', () => {
  it('converts equal shares to the starting stake', () => {
    const dollars = toDollars(new Float64Array(4).fill(0.25), 100);
    expect(Array.from(dollars)).toEqual([100, 100, 100, 100]);
  });
});

describe('linearBins', () => {
  it('places every agent in exactly one bin', () => {
    const amounts = [0, 10, 20, 99, 100];
    const { counts, binOf, edges } = linearBins(amounts, 5);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(amounts.length);
    expect(edges).toHaveLength(6);
    expect(edges[0]).toBe(0);
    expect(edges[5]).toBe(100);
    expect(binOf[4]).toBe(4); // max lands in the last bin, not out of range
  });

  it('rejects degenerate bin counts', () => {
    expect(() => linearBins([1, 2], 1)).toThrow(RangeError);
  });
});

describe('logBins', () => {
  it('separates dust below the floor and bins the rest by decade', () => {
    const amounts = [0, 0.001, 0.05, 0.5, 5, 50, 5000];
    const result = logBins(amounts, 0.01);
    expect(result.dustCount).toBe(2);
    expect(result.dustOf[0]).toBe(true);
    expect(result.dustOf[1]).toBe(true);
    expect(result.counts.reduce((a, b) => a + b, 0)).toBe(amounts.length - 2);
    // 0.05 → [0.01, 0.1), 5 → [1, 10), 5000 → [1000, 10000)
    expect(result.binOf[2]).toBe(0);
    expect(result.binOf[4]).toBe(2);
    expect(result.binOf[6]).toBe(5);
    expect(result.edges[0]).toBeCloseTo(0.01);
  });

  it('covers the maximum value with its top edge', () => {
    const result = logBins([0.02, 9999], 0.01);
    expect(result.edges[result.edges.length - 1]).toBeGreaterThanOrEqual(9999);
  });

  it('rejects a non-positive floor', () => {
    expect(() => logBins([1], 0)).toThrow(RangeError);
  });
});

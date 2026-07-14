import { describe, expect, it } from 'vitest';
import { geometricBins, rangedLinearBins, StickyRange } from './histBins';

describe('geometricBins', () => {
  it('puts an equal-start spike in one bin and leaves neighbors empty', () => {
    // $1 … $1000, 10 bins → decade-ish bins; all mass at $100
    const amounts = new Array(50).fill(100);
    const b = geometricBins(amounts, 1, 1000, 10);
    expect(b.counts.reduce((a, c) => a + c, 0)).toBe(50);
    expect(Math.max(...b.counts)).toBe(50);
    expect(b.counts.filter((c) => c === 0).length).toBe(9);
    expect(b.underCount).toBe(0);
  });

  it('sends zeros and sub-range values to underCount — no log home for 0', () => {
    const b = geometricBins([0, 0.5, 10], 1, 1000, 4);
    expect(b.underCount).toBe(2);
    expect(b.counts.reduce((a, c) => a + c, 0)).toBe(1);
  });

  it('clamps values at or above hi into the top bin', () => {
    const b = geometricBins([999, 1000, 5000], 1, 1000, 5);
    expect(b.counts[4]).toBe(3);
  });

  it('edges are geometric: constant ratio between neighbors', () => {
    const b = geometricBins([], 1, 10_000, 4);
    for (let k = 1; k < b.edges.length; k++) {
      expect(b.edges[k] / b.edges[k - 1]).toBeCloseTo(10, 9);
    }
  });
});

describe('rangedLinearBins', () => {
  it('includes zero in the first bin and shows the initial spike mid-range', () => {
    const amounts = [0, 100, 100, 100, 199.9];
    const b = rangedLinearBins(amounts, 200, 16);
    expect(b.counts[0]).toBe(1);
    expect(b.counts[8]).toBe(3); // $100 of [0, 200] in 16 bins → bin 8
    expect(b.underCount).toBe(0);
  });
});

describe('StickyRange', () => {
  it('expands immediately, shrinks only after the hold', () => {
    const r = new StickyRange(1, 1000, 100);
    expect(r.update(50, 500, 0)).toEqual({ lo: 1, hi: 1000 }); // initial range floors it
    expect(r.update(0.01, 5000, 10)).toEqual({ lo: 0.01, hi: 5000 }); // grow now
    expect(r.update(50, 500, 20)).toEqual({ lo: 0.01, hi: 5000 }); // not yet
    expect(r.update(50, 500, 200)).toEqual({ lo: 1, hi: 1000 }); // held long enough
  });
});

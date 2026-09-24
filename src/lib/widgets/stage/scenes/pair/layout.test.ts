import { describe, expect, it } from 'vitest';
import { lattice, pairLayout } from './layout';

describe('the pair stage layout', () => {
  for (const [w, h] of [[1280, 900], [390, 844], [1920, 1080], [844, 390]]) {
    it(`keeps Red and MATH on the left, Blue and MERIT on the right — ${w}×${h}`, () => {
      const L = pairLayout(w, h);
      expect(L.markRed.x).toBeLessThan(L.markBlue.x);
      expect(L.seatRed.x).toBeLessThan(L.seatBlue.x);
      expect(L.room.positions[L.room.red].x).toBeLessThan(L.room.positions[L.room.blue].x);
    });

    it(`fits the whole crowd on screen — ${w}×${h}`, () => {
      const L = pairLayout(w, h);
      const r = L.radius(1);
      for (const home of L.crowdHomes) {
        expect(home.x - r).toBeGreaterThanOrEqual(0);
        expect(home.x + r).toBeLessThanOrEqual(w);
        expect(home.y + r).toBeLessThanOrEqual(h);
      }
    });
  }

  it('draws area as wealth: sixteen coins make one whole fortune', () => {
    const L = pairLayout(1280, 900);
    expect(L.radius(16)).toBeCloseTo(L.whole, 9);
    expect(L.radius(4) / L.radius(16)).toBeCloseTo(0.5, 9);
  });

  it('never lets a protagonist vanish when poor', () => {
    expect(pairLayout(390, 844).minRadius).toBeGreaterThan(0);
  });
});

describe('a pile of coins inside its fortune', () => {
  it('holds exactly the coins it is given', () => {
    for (const n of [1, 4, 7, 8, 12, 15, 16]) expect(lattice(n, 10).spots).toHaveLength(n);
  });

  it('never spills over the edge of the circle', () => {
    const L = pairLayout(1280, 900);
    for (const n of [1, 3, 4, 6, 7, 8, 9, 10, 12, 15, 16]) {
      const fit = L.radius(n);
      const pile = lattice(n, L.coinRadius, fit);
      for (const spot of pile.spots) expect(Math.hypot(spot.x, spot.y) + pile.r).toBeLessThanOrEqual(fit + 1e-9);
    }
  });

  it('only ever shrinks a crowded pile — money is one size, a sparse pile is not blown up', () => {
    expect(lattice(1, 10, 500).r).toBe(10);
    expect(lattice(16, 10, 20).r).toBeLessThan(10);
  });

  it('comes out the same every time', () => {
    expect(lattice(12, 10, 40)).toEqual(lattice(12, 10, 40));
  });
});

import { describe, expect, it } from 'vitest';
import { arrival, fallTime, gait, gravity, hopsAlong, squashed } from './hops';

const unit = 10;
const g = gravity(40);
const from = { x: 0, y: 100 };
const to = { x: 600, y: 100 };

describe('hops under one gravity', () => {
  it('flies every hop as a parabola under g: up from rest to the top, and down again', () => {
    for (const r of [10, 25, 60])
      for (const h of hopsAlong({ x: 0, y: 120 }, { x: 400, y: 80 }, 0, r, unit, g)) {
        expect(h.top).toBeLessThan(Math.min(h.from.y, h.to.y));
        expect(h.apex - h.lift).toBeCloseTo(fallTime(h.from.y - h.top, g), 9);
        expect(h.land - h.apex).toBeCloseTo(fallTime(h.to.y - h.top, g), 9);
      }
  });

  it('hops a small body often and short, a big one rarely and long', () => {
    const small = hopsAlong(from, to, 0, 10, unit, g);
    const big = hopsAlong(from, to, 0, 40, unit, g);
    const step = (hs: typeof small) => hs[0].to.x - hs[0].from.x;
    const pace = (hs: typeof small) => hs[1].start - hs[0].start;
    expect(small.length).toBeGreaterThan(big.length);
    expect(step(small)).toBeLessThan(step(big));
    expect(pace(small)).toBeLessThan(pace(big));
    // flight time grows as the square root of size: four times the radius, twice the time in the air
    expect((big[0].land - big[0].lift) / (small[0].land - small[0].lift)).toBeCloseTo(2, 5);
  });

  it('makes the big soft and the small hard: a deeper squash and a slower settle', () => {
    const hard = gait(10, unit, g);
    const soft = gait(45, unit, g);
    expect(hard.soft).toBe(0);
    expect(soft.soft).toBe(1);
    expect(soft.squash).toBeGreaterThan(hard.squash);
    expect(soft.settle / soft.crouch).toBeGreaterThan(hard.settle / hard.crouch);
  });

  it('keeps the area in every squash and stretch: area is wealth', () => {
    for (const q of [-0.3, -0.05, 0, 0.12, 0.4]) {
      const s = squashed(q);
      expect(s.sx * s.sy).toBeCloseTo(1, 12);
    }
  });

  it('bounds further on a long trip without staying longer in the air', () => {
    const walk = hopsAlong(from, to, 0, 10, unit, g);
    const bound = hopsAlong(from, to, 0, 10, unit, g, 1, 2.2);
    expect(bound.length).toBeLessThan(walk.length);
    expect(bound[0].land - bound[0].lift).toBeCloseTo(walk[0].land - walk[0].lift, 9);
    expect(arrival(bound, 0)).toBeLessThan(arrival(walk, 0));
  });

  it('stays put when already there', () => {
    expect(hopsAlong(from, from, 3, 10, unit, g)).toEqual([]);
    expect(arrival([], 3)).toBe(3);
  });
});

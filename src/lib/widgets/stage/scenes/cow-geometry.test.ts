import { describe, expect, it } from 'vitest';
import {
  BODY_COW,
  BODY_SPHERE,
  MOUTH,
  EYE,
  UDDER_COW,
  UDDER_SPHERE,
  SPOTS_COW,
  SPOTS_SPHERE,
  TAIL_COW,
  TAIL_SPHERE,
  teatPath,
} from './cow-geometry';

/** First and last coordinate pair of a path's command endpoints. */
function endpoints(d: string): { x1: number; y1: number; x2: number; y2: number } {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return { x1: nums[0], y1: nums[1], x2: nums[nums.length - 2], y2: nums[nums.length - 1] };
}

describe('cow geometry invariants', () => {
  it('both bodies share the vertical axis x=150', () => {
    expect(BODY_COW.cx).toBe(150);
    expect(BODY_SPHERE.cx).toBe(150);
    expect(BODY_SPHERE.r).toBe(120);
  });

  it('every mouth state is symmetric about x=150', () => {
    for (const [name, d] of Object.entries(MOUTH)) {
      const { x1, x2 } = endpoints(d);
      expect(Math.abs(x1 + x2 - 300), `${name}: ${x1}..${x2}`).toBeLessThan(0.5);
    }
  });

  it('four teats per pose, centred on the sack', () => {
    expect(UDDER_COW.teats).toHaveLength(4);
    expect(UDDER_SPHERE.teats).toHaveLength(4);
    const cx = UDDER_SPHERE.teats.reduce((s, t) => s + t.x, 0) / 4;
    const cy = UDDER_SPHERE.teats.reduce((s, t) => s + t.y, 0) / 4;
    expect(cx).toBeCloseTo(UDDER_SPHERE.cx, 1);
    expect(cy).toBeCloseTo(UDDER_SPHERE.cy, 1);
  });

  it('spot counts match across poses (they crossfade in the morph)', () => {
    expect(SPOTS_COW.length).toBe(SPOTS_SPHERE.length);
  });

  it('tail tips sit on their curve starts', () => {
    for (const tail of [TAIL_COW, TAIL_SPHERE]) {
      const { x1, y1 } = endpoints(tail.d);
      expect(x1).toBeCloseTo(tail.tip.x, 1);
      expect(y1).toBeCloseTo(tail.tip.y, 1);
    }
  });

  it('eye iris stays inside the white in both states', () => {
    const dSleepy = Math.hypot(EYE.irisSleepy.x - EYE.cx, EYE.irisSleepy.y - EYE.cy);
    expect(dSleepy + EYE.irisR).toBeLessThanOrEqual(EYE.r + 0.5);
    expect(EYE.pupilDilatedR).toBeLessThanOrEqual(EYE.irisR);
  });

  it('teatPath emits a closed half-ellipse', () => {
    expect(teatPath(10, 20, 3, 5)).toBe('M 7 20 A 3 5 0 0 0 13 20 Z');
  });
});

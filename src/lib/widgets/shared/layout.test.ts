import { describe, expect, it } from 'vitest';
import { radiusScale, roomPositions } from './layout';

describe('roomPositions', () => {
  it('returns an empty layout for unmeasured canvases instead of hanging', () => {
    // regression 2026-07-14: width 0 made cols 0 → rows ∞ → infinite loop
    expect(roomPositions(100, 0, 300)).toEqual([]);
    expect(roomPositions(100, 400, 0)).toEqual([]);
    expect(roomPositions(0, 400, 300)).toEqual([]);
  });

  it('places exactly n agents inside the box', () => {
    for (const n of [1, 2, 25, 100, 400]) {
      const pts = roomPositions(n, 800, 500);
      expect(pts.length).toBe(n);
      for (const p of pts) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(800);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(500);
      }
    }
  });

  it('balances rows: no row is more than one agent short of another', () => {
    // 100 agents in a wide box previously left a half-empty last row.
    // Rows sit one cell apart with ±0.16-cell jitter — cluster on the gaps.
    const pts = roomPositions(100, 900, 600);
    const ys = pts.map((p) => p.y).sort((a, b) => a - b);
    const gaps = ys.slice(1).map((y, i) => y - ys[i]);
    const rowGap = Math.max(...gaps);
    const counts: number[] = [1];
    for (const gap of gaps) {
      if (gap > rowGap / 2) counts.push(1);
      else counts[counts.length - 1]++;
    }
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('is deterministic', () => {
    expect(roomPositions(60, 640, 480)).toEqual(roomPositions(60, 640, 480));
  });
});

describe('room shapes stay inside the canvas', () => {
  // regression 2026-08-25: the inset was a flat 16px and knew nothing about
  // shape reach, so equal-area triangles — 1.56x their circle's radius —
  // crossed the edge and the first room rendered visibly clipped.
  const SHAPE_REACH = 1.6;

  for (const [n, w, h] of [
    [100, 832, 320],
    [64, 640, 400],
    [400, 900, 600],
    [9, 300, 300],
  ] as const) {
    it(`n=${n} in ${w}x${h}`, () => {
      const pts = roomPositions(n, w, h);
      const reach = radiusScale(n, w, h) * Math.sqrt(1 / n) * SHAPE_REACH;
      expect(reach).toBeGreaterThan(0);
      for (const p of pts) {
        expect(p.x - reach).toBeGreaterThanOrEqual(0);
        expect(p.x + reach).toBeLessThanOrEqual(w);
        expect(p.y - reach).toBeGreaterThanOrEqual(0);
        expect(p.y + reach).toBeLessThanOrEqual(h);
      }
    });
  }
});

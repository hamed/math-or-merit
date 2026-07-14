import { describe, expect, it } from 'vitest';
import { roomPositions } from './layout';

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

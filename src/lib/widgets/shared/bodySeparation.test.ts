import { describe, expect, it } from 'vitest';
import { attractBodies, separateBodies, type SeparationBody } from './bodySeparation';

const box = { x: 0, y: 0, w: 400, h: 300 };
const apart = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('display body separation', () => {
  it('leaves separated bodies and their sizes unchanged', () => {
    const bodies = [{ x: 50, y: 50, r: 10 }, { x: 100, y: 50, r: 20 }];
    expect(separateBodies(bodies, box)).toEqual(bodies.map(({ x, y }) => ({ x, y })));
    expect(bodies.map((p) => p.r)).toEqual([10, 20]);
  });

  it('separates unequal circles, including coincident centers, deterministically', () => {
    const bodies = [{ x: 100, y: 100, r: 40 }, { x: 100, y: 100, r: 10 }];
    const points = separateBodies(bodies, box);
    expect(apart(points[0], points[1])).toBeGreaterThan(51.98);
    expect(apart(points[0], bodies[0])).toBeLessThan(apart(points[1], bodies[1]));
    expect(separateBodies(bodies, box)).toEqual(points);
  });

  it('clears a triangle tip and a square corner, beyond their equal-area circle radius', () => {
    for (const shape of ['triangle', 'triangleDown', 'square'] as const) {
      const bodies: SeparationBody[] = [{ x: 150, y: 140, r: 30, shape }, { x: 150, y: shape === 'triangleDown' ? 185 : shape === 'square' ? 110 : 95, r: 10 }];
      const points = separateBodies(bodies, box);
      const tip = shape === 'square' ? 30 * Math.sqrt(Math.PI) / 2 : 30 * Math.sqrt(4 * Math.PI / (3 * Math.sqrt(3)));
      // Restrict motion to the vertical axis so the exact tip clearance is known.
      const vertical = separateBodies(bodies, box, { verticalOnly: true });
      expect(apart(vertical[0], vertical[1])).toBeGreaterThan(tip + 10 + 1.9);
      expect(points).not.toEqual(bodies.map(({ x, y }) => ({ x, y })));
    }
  });

  it('separates a crowded room while respecting walls', () => {
    const bodies = Array.from({ length: 100 }, (_, i) => ({ x: 40 + (i % 10) * 26, y: 30 + Math.floor(i / 10) * 23, r: i === 44 ? 55 : 7 }));
    const points = separateBodies(bodies, box, { iterations: 160 });
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      expect(p.x).toBeGreaterThanOrEqual(bodies[i].r);
      expect(p.x).toBeLessThanOrEqual(box.w - bodies[i].r);
      expect(p.y).toBeGreaterThanOrEqual(bodies[i].r);
      expect(p.y).toBeLessThanOrEqual(box.h - bodies[i].r);
      for (let j = i + 1; j < points.length; j++) expect(apart(p, points[j])).toBeGreaterThan(bodies[i].r + bodies[j].r + 1.9);
    }
  });

  it('does not let a large triangle clip through the room edge', () => {
    const points = separateBodies([{ x: 390, y: 290, r: 80, shape: 'triangle' }], box);
    const halfSide = 80 * Math.sqrt(Math.PI / Math.sqrt(3));
    expect(points[0].x + halfSide).toBeLessThan(400);
    expect(points[0].y + 80 * Math.sqrt(Math.PI / (3 * Math.sqrt(3)))).toBeLessThan(300);
  });

  it('can disable repulsion without changing body sizes', () => {
    const bodies = [{ x: 100, y: 100, r: 40 }, { x: 110, y: 100, r: 10 }];
    expect(separateBodies(bodies, box, { iterations: 0 })).toEqual(bodies.map(({ x, y }) => ({ x, y })));
  });

  it('keeps chart positions on their horizontal values while separating vertically', () => {
    const bodies = [{ x: 120, y: 200, r: 20 }, { x: 125, y: 200, r: 20 }];
    const points = separateBodies(bodies, box, { verticalOnly: true });
    expect(points.map((p) => p.x)).toEqual([120, 125]);
    expect(apart(points[0], points[1])).toBeGreaterThan(41.98);
  });

  it('attracts nearby bodies gently and leaves distant ones alone', () => {
    const bodies = [{ x: 100, y: 100, r: 10 }, { x: 150, y: 100, r: 10 }, { x: 350, y: 250, r: 10 }];
    const points = attractBodies(bodies, 16);
    expect(apart(points[0], points[1])).toBeLessThan(50);
    expect(apart(points[0], bodies[0])).toBeLessThan(0.5);
    expect(points[2]).toEqual({ x: 350, y: 250 });
    expect(attractBodies(bodies, 0)).toEqual(bodies.map(({ x, y }) => ({ x, y })));
    expect(attractBodies([{ x: 50, y: 50, r: 10 }, { x: 50, y: 50, r: 10 }], 1000))
      .toEqual([{ x: 50, y: 50 }, { x: 50, y: 50 }]);
  });
});

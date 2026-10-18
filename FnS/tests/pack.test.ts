import { describe, expect, it } from 'vitest';
import { createBoxes, packRectangles, squarify, type Boxes } from '../stage/core/pack.ts';
import { Rng } from '../stage/core/rng.ts';

const areaOf = (b: Boxes, i: number) => (b.x1[i] - b.x0[i]) * (b.y1[i] - b.y0[i]);

function overlap(b: Boxes): number {
  let total = 0;
  for (let i = 0; i < b.count; i++) {
    for (let j = i + 1; j < b.count; j++) {
      const ox = Math.min(b.x1[i], b.x1[j]) - Math.max(b.x0[i], b.x0[j]);
      const oy = Math.min(b.y1[i], b.y1[j]) - Math.max(b.y0[i], b.y0[j]);
      if (ox > 0 && oy > 0) total += ox * oy;
    }
  }
  return total;
}

const descending = (w: ArrayLike<number>) => Int32Array.from({ length: w.length }, (_, i) => i).sort((a, b) => w[b] - w[a] || a - b);

describe('squarified treemap', () => {
  it('partitions the container exactly in proportion', () => {
    const rng = new Rng(3);
    const n = 500;
    const weights = Float64Array.from({ length: n }, () => 0.001 + rng.next() ** 4 * 50);
    const boxes = createBoxes(n);
    squarify(weights, descending(weights), { x0: 0, y0: 0, x1: 37, y1: 11 }, boxes);
    expect(overlap(boxes)).toBe(0);
    let sum = 0;
    let weight = 0;
    for (let i = 0; i < n; i++) {
      weight += weights[i];
      sum += areaOf(boxes, i);
      expect(boxes.x0[i]).toBeGreaterThanOrEqual(0);
      expect(boxes.y1[i]).toBeLessThanOrEqual(11);
    }
    expect(sum).toBeCloseTo(37 * 11, 9);
    for (let i = 0; i < n; i++) expect(areaOf(boxes, i) / ((weights[i] / weight) * 37 * 11)).toBeCloseTo(1, 6);
  });

  it('never turns a cell inside out, however small its share (rounding at the thin end)', () => {
    const rng = new Rng(5);
    const n = 200;
    const weights = Float64Array.from({ length: n }, () => (rng.next() ** 30) ** 2 + 1e-20);
    const boxes = createBoxes(n);
    squarify(weights, descending(weights), { x0: 0, y0: 0, x1: 0.25, y1: 0.23 }, boxes);
    for (let i = 0; i < n; i++) {
      expect(boxes.x1[i]).toBeGreaterThanOrEqual(boxes.x0[i]);
      expect(boxes.y1[i]).toBeGreaterThanOrEqual(boxes.y0[i]);
      expect(boxes.x1[i]).toBeLessThanOrEqual(0.25);
      expect(boxes.y1[i]).toBeLessThanOrEqual(0.23);
    }
  });

  it('keeps equal items square', () => {
    const boxes = createBoxes(16);
    squarify(new Float64Array(16).fill(1), Int32Array.from({ length: 16 }, (_, i) => i), { x0: 0, y0: 0, x1: 4, y1: 4 }, boxes);
    for (let i = 0; i < 16; i++) {
      expect(boxes.x1[i] - boxes.x0[i]).toBeCloseTo(1, 12);
      expect(boxes.y1[i] - boxes.y0[i]).toBeCloseTo(1, 12);
    }
  });
});

describe('shell packing', () => {
  it('packs rectangles without overlap, inside the limit where they fit', () => {
    const rng = new Rng(7);
    const n = 120;
    const w = Float64Array.from({ length: n }, () => 0.02 + rng.next() * 0.2);
    const h = Float64Array.from({ length: n }, () => 0.02 + rng.next() * 0.2);
    const boxes = createBoxes(n);
    packRectangles(w, h, descending(w), 2, boxes);
    expect(overlap(boxes)).toBe(0);
    for (let i = 0; i < n; i++) {
      expect(boxes.x0[i]).toBeGreaterThanOrEqual(0);
      expect(boxes.y0[i]).toBeGreaterThanOrEqual(0);
      expect(boxes.x1[i]).toBeLessThanOrEqual(2 + 1e-12);
      expect(boxes.x1[i] - boxes.x0[i]).toBeCloseTo(w[i], 14);
    }
  });
});

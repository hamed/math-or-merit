import { describe, expect, it } from 'vitest';
import { coinHeap } from './coinHeap';

describe('a coin split into a hundred, in place', () => {
  const heap = coinHeap(100, 50, { x: 200, y: 100 });

  it('keeps the area: a hundred small coins hold as much as the one', () => {
    expect(100 * heap.r ** 2).toBeCloseTo(50 ** 2, 9);
  });

  it('packs them without overlap', () => {
    for (let i = 0; i < 100; i++)
      for (let j = i + 1; j < 100; j++) expect(Math.hypot(heap.spots[i].x - heap.spots[j].x, heap.spots[i].y - heap.spots[j].y)).toBeGreaterThanOrEqual(2 * heap.r * 0.98);
  });

  it('covers the coin it was, a little wider for the gaps', () => {
    expect(heap.reach).toBeGreaterThan(50);
    expect(heap.reach).toBeLessThan(50 * 1.4);
  });
});

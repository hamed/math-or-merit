import { describe, expect, it } from 'vitest';
import { decadeEdges, keepLabels, type RulerLabel } from './rulerLabels';

describe('decade edges', () => {
  it('runs from the floor to the top, one decade at a time', () => {
    expect(decadeEdges(0.01, 10_000)).toEqual([0.01, 0.1, 1, 10, 100, 1_000, 10_000].map((v) => expect.closeTo(v, 12)));
  });

  it('stops at the last decade that fits under the top', () => {
    expect(decadeEdges(1, 7_500)).toHaveLength(4);
  });

  it('lands each mark exactly on its decade, with no drift from repeated multiplication', () => {
    for (const [k, edge] of decadeEdges(0.01, 1e9).entries()) {
      expect(Math.log10(edge / 0.01)).toBeCloseTo(k, 12);
    }
  });

  it('returns nothing it cannot draw', () => {
    expect(decadeEdges(0, 100)).toEqual([]);
    expect(decadeEdges(10, 1)).toEqual([]);
    expect(decadeEdges(1, Number.POSITIVE_INFINITY)).toEqual([]);
  });
});

describe('keeping labels that fit', () => {
  const label = (key: string, x: number, priority: number, anchor: RulerLabel['anchor'] = 'middle'): RulerLabel => ({
    key,
    x,
    text: 'abcd',
    priority,
    anchor,
  });

  it('keeps everything that is spread out', () => {
    const shown = keepLabels([label('a', 0, 0), label('b', 100, 1), label('c', 200, 2)], 5, 4);
    expect([...shown].sort()).toEqual(['a', 'b', 'c']);
  });

  it('drops the lower-priority label of a colliding pair, whichever order they arrive in', () => {
    expect(keepLabels([label('late', 10, 5), label('early', 12, 0)], 5, 4)).toEqual(new Set(['early']));
  });

  it('crowds the small decades out of an ordinary ruler, which is the point', () => {
    // Seven decades on a ruler whose right end is $7,500: everything below
    // $1,000 lands within the first few units of $0.
    const max = 7_500;
    const at = (v: number) => 24 + (v / max) * 432;
    const decades = [0.01, 0.1, 1, 10, 100, 1_000];
    const labels: RulerLabel[] = [
      { key: 'zero', x: 24, text: '$0', priority: 0, anchor: 'start' },
      { key: 'end', x: 456, text: '$7.5k', priority: 1, anchor: 'end' },
      ...decades.map((v, i) => ({
        key: `d${i}`,
        x: at(v),
        text: 'xxxx',
        priority: 2 + (decades.length - 1 - i),
        anchor: 'middle' as const,
      })),
    ];
    const shown = keepLabels(labels, 6.4, 4);
    expect(shown.has('zero')).toBe(true);
    expect(shown.has('end')).toBe(true);
    expect(shown.has('d5')).toBe(true); // $1k has room
    for (const small of ['d0', 'd1', 'd2', 'd3', 'd4']) expect(shown.has(small)).toBe(false);
  });

  it('treats anchors as the text actually sits', () => {
    const start: RulerLabel = { key: 's', x: 0, text: 'abcd', priority: 0, anchor: 'start' };
    const end: RulerLabel = { key: 'e', x: 30, text: 'abcd', priority: 1, anchor: 'end' };
    // start spans 0–20, end spans 10–30: they overlap
    expect(keepLabels([start, end], 5, 0)).toEqual(new Set(['s']));
  });
});

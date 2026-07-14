import { describe, expect, it } from 'vitest';
import { compactNumber, logBinTicks, logTicks, niceLinearTicks, percentNumber } from './ticks';

describe('niceLinearTicks', () => {
  it('gives the canonical percent ladder for 0..1', () => {
    expect(niceLinearTicks(0, 1)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('gives 0, 250, 500, 750, 1000 for money to $1k', () => {
    expect(niceLinearTicks(0, 1000)).toEqual([0, 250, 500, 750, 1000]);
  });

  it('never invents un-round steps like 2.1', () => {
    for (const [lo, hi] of [
      [0, 8.4],
      [0, 137],
      [3, 97],
      [0, 0.63],
    ]) {
      for (const t of niceLinearTicks(lo, hi)) {
        // every tick must be an integer multiple of a 1/2/2.5/5 step
        const step = niceLinearTicks(lo, hi)[1] - niceLinearTicks(lo, hi)[0];
        expect(Math.abs(t / step - Math.round(t / step))).toBeLessThan(1e-6);
      }
    }
  });

  it('does not use the data min/max as labels unless they are round', () => {
    const ticks = niceLinearTicks(0, 137);
    expect(ticks).not.toContain(137);
  });
});

describe('logTicks', () => {
  it('gives decades across a wide range', () => {
    expect(logTicks(0.1, 10_000)).toEqual([0.1, 1, 10, 100, 1000, 10_000]);
  });

  it('thins decades when there are too many', () => {
    const ticks = logTicks(1e-9, 1e6, 6);
    expect(ticks.length).toBeLessThanOrEqual(6);
    for (const t of ticks) expect(Math.log10(t) % 1).toBeCloseTo(0, 9);
  });

  it('falls back to 1-2-5 mantissas on a narrow span', () => {
    expect(logTicks(1, 60)).toEqual([1, 2, 5, 10, 20, 50]);
  });
});

describe('logBinTicks', () => {
  it('labels powers of two when the bin ratio is ~2 (10 bins over 3 decades)', () => {
    const ticks = logBinTicks(1, 1000, 10);
    for (const t of ticks) expect(Math.log2(t) % 1).toBeCloseTo(0, 9);
    expect(ticks[0]).toBe(1);
  });

  it('thins base-2 labels to every other power when crowded: 1, 4, 16…', () => {
    const ticks = logBinTicks(1, 100_000, 17, 6); // ratio ≈ 2, 17 powers
    const exps = ticks.map((t) => Math.log2(t));
    expect(exps[1] - exps[0]).toBeGreaterThanOrEqual(2);
  });

  it('uses decades for other bin counts', () => {
    expect(logBinTicks(1, 1000, 4)).toEqual([1, 10, 100, 1000]);
  });
});

describe('formatting', () => {
  it('compactNumber: bare, unit-free, round', () => {
    expect(compactNumber(0)).toBe('0');
    expect(compactNumber(0.001)).toBe('0.001');
    expect(compactNumber(0.5)).toBe('0.5');
    expect(compactNumber(250)).toBe('250');
    expect(compactNumber(1000)).toBe('1k');
    expect(compactNumber(2500)).toBe('2.5k');
    expect(compactNumber(1_000_000)).toBe('1M');
  });

  it('percentNumber turns fractions into bare percent numbers', () => {
    expect(percentNumber(0.25)).toBe('25');
    expect(percentNumber(1)).toBe('100');
    expect(percentNumber(0.001)).toBe('0.1');
  });
});

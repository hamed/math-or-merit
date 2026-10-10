import { describe, expect, it } from 'vitest';
import { SCALING_STAKES, scaledTrades, scalingCurves } from './scaling';

describe('the stake scales time', () => {
  const span = 120_000;
  const curves = scalingCurves(span, 2_000);

  it('makes a smaller stake slower in plain trades', () => {
    const at = (c: (typeof curves)[number], trades: number) => c.players[Math.round(trades / 2_000)];
    const [big, mid, small] = curves;
    expect(at(big, 40_000)).toBeLessThan(at(mid, 40_000));
    expect(at(mid, 40_000)).toBeLessThan(at(small, 40_000));
  });

  it('puts every stake on one curve once time is counted in stake squared', () => {
    for (const x of [20_000, 60_000, 120_000]) {
      const values = curves.map((c) => {
        const k = c.trades.findIndex((t) => scaledTrades(t, c.stake) >= x);
        return c.players[k];
      });
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      for (const v of values) expect(Math.abs(v - mean) / mean).toBeLessThan(0.2);
    }
    expect(SCALING_STAKES).toHaveLength(3);
  });
});

import { describe, expect, it } from 'vitest';
import { exponentialFit, linearFit, logLinearFit, powerTailFit } from './fits';

describe('linearFit', () => {
  it('recovers a clean line', () => {
    const fit = linearFit([0, 1, 2, 3], [1, 3, 5, 7]);
    expect(fit?.slope).toBeCloseTo(2, 9);
    expect(fit?.intercept).toBeCloseTo(1, 9);
  });

  it('refuses degenerate input', () => {
    expect(linearFit([1], [1])).toBeNull();
    expect(linearFit([2, 2, 2], [1, 2, 3])).toBeNull();
  });
});

describe('powerTailFit', () => {
  it('recovers the exponent of a synthetic Pareto tail', () => {
    // survival y = x^-2: x_i chosen so that (n-i)/n = x^-2
    const n = 200;
    const values = Array.from({ length: n }, (_, i) => ((n - i) / n) ** (-1 / 2));
    const fit = powerTailFit(values, n);
    expect(fit).not.toBeNull();
    expect(fit!.alpha).toBeCloseTo(2, 1);
  });

  it('returns null when there is nothing to fit', () => {
    expect(powerTailFit([1, 1, 1, 1, 1], 5)).toBeNull(); // degenerate: one x value
    expect(powerTailFit([], 5)).toBeNull();
  });
});

describe('exponentialFit', () => {
  it('recovers the temperature of a synthetic exponential', () => {
    // survival e^(-x/50): x_i = -50 ln((n-i)/n)
    const n = 200;
    const values = Array.from({ length: n }, (_, i) => -50 * Math.log((n - i) / n));
    const fit = exponentialFit(values, n);
    expect(fit).not.toBeNull();
    expect(fit!.scale).toBeCloseTo(50, 0);
  });
});

describe('logLinearFit', () => {
  it('recovers the per-decade slope of a survival curve linear in log x', () => {
    // survival y falls linearly over 3 decades: x_i = 10^(3(1 - y_i))
    const n = 300;
    const values = Array.from({ length: n }, (_, i) => 10 ** (3 * (1 - (n - i) / n)));
    const fit = logLinearFit(values, n);
    expect(fit).not.toBeNull();
    expect(fit!.slopePerDecade).toBeCloseTo(-1 / 3, 1);
  });
});

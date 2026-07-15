/**
 * Tiny fits for the hover insights (owner review 2026-07-14): a power-law
 * tail line on the log-log CCDF, an exponential-decay line on the semi-log
 * view. Display-layer only — nothing here feeds the simulation.
 */

export interface LineFit {
  slope: number;
  intercept: number;
}

/** Ordinary least squares. Null when there is nothing to fit. */
export function linearFit(xs: readonly number[], ys: readonly number[]): LineFit | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / denom;
  return { slope, intercept: (sy - slope * sx) / n };
}

export interface TailFit {
  /** P(X > x) ~ x^-alpha over [lo, hi]. */
  alpha: number;
  lo: number;
  hi: number;
  /** Survival fraction predicted at lo (anchors the drawn line). */
  yAtLo: number;
}

/**
 * Power-law fit to the upper tail of a survival curve: the points with
 * survival ≤ maxSurvival (default: the richest half), in log10-log10 space.
 */
export function powerTailFit(sortedAsc: readonly number[], total: number, maxSurvival = 0.5): TailFit | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < sortedAsc.length; i++) {
    const y = (sortedAsc.length - i) / total; // survival just below sortedAsc[i]
    if (y > maxSurvival || sortedAsc[i] <= 0 || y <= 0) continue;
    xs.push(Math.log10(sortedAsc[i]));
    ys.push(Math.log10(y));
  }
  if (xs.length < 4) return null;
  const fit = linearFit(xs, ys);
  if (!fit || !(fit.slope < 0)) return null;
  const lo = 10 ** xs[0];
  const hi = 10 ** xs[xs.length - 1];
  return { alpha: -fit.slope, lo, hi, yAtLo: 10 ** (fit.intercept + fit.slope * xs[0]) };
}

export interface DecayFit {
  /** P(X > x) ~ e^(-x/scale) — `scale` is the temperature of the bulk. */
  scale: number;
  lo: number;
  hi: number;
  yAtLo: number;
}

/** Exponential fit to a survival curve (straight on semi-log axes). */
export function exponentialFit(sortedAsc: readonly number[], total: number): DecayFit | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < sortedAsc.length; i++) {
    const y = (sortedAsc.length - i) / total;
    if (sortedAsc[i] < 0 || y <= 0) continue;
    xs.push(sortedAsc[i]);
    ys.push(Math.log(y));
  }
  if (xs.length < 4) return null;
  const fit = linearFit(xs, ys);
  if (!fit || !(fit.slope < 0)) return null;
  const lo = xs[0];
  const hi = xs[xs.length - 1];
  return { scale: -1 / fit.slope, lo, hi, yAtLo: Math.exp(fit.intercept + fit.slope * lo) };
}

export interface LogLinearFit {
  /** Survival drops `slopePerDecade` (negative) per decade of wealth. */
  slopePerDecade: number;
  lo: number;
  hi: number;
  yAtLo: number;
}

/**
 * Line fit for the x-log / y-linear view: survival vs log10(wealth) over the
 * curve's middle. A straight line there is the lognormal-ish bulk the
 * yard-sale drift produces — the slope says what share of the room each
 * decade of wealth crosses.
 */
export function logLinearFit(sortedAsc: readonly number[], total: number): LogLinearFit | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < sortedAsc.length; i++) {
    const y = (sortedAsc.length - i) / total;
    if (sortedAsc[i] <= 0 || y < 0.05 || y > 0.95) continue;
    xs.push(Math.log10(sortedAsc[i]));
    ys.push(y);
  }
  if (xs.length < 4) return null;
  const fit = linearFit(xs, ys);
  if (!fit || !(fit.slope < 0)) return null;
  const lo = 10 ** xs[0];
  const hi = 10 ** xs[xs.length - 1];
  return { slopePerDecade: fit.slope, lo, hi, yAtLo: fit.intercept + fit.slope * xs[0] };
}

/** Headless binning for the distribution chapter. Amounts are display dollars. */

export function toDollars(wealthShares: ArrayLike<number>, startDollars: number): Float64Array {
  const n = wealthShares.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = wealthShares[i] * n * startDollars;
  return out;
}

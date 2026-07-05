/** Headless binning for the distribution chapter. Amounts are display dollars. */

export function toDollars(wealthShares: ArrayLike<number>, startDollars: number): Float64Array {
  const n = wealthShares.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = wealthShares[i] * n * startDollars;
  return out;
}

export interface LinearBinning {
  /** binCount + 1 ascending edges from 0 to max (inclusive). */
  readonly edges: number[];
  readonly counts: number[];
  /** For each agent, the bin index it fell into. */
  readonly binOf: number[];
}

export function linearBins(amounts: ArrayLike<number>, binCount: number): LinearBinning {
  if (!Number.isSafeInteger(binCount) || binCount < 2) {
    throw new RangeError('binCount must be an integer of at least 2');
  }
  let max = 0;
  for (let i = 0; i < amounts.length; i++) max = Math.max(max, amounts[i]);
  if (max === 0) max = 1;
  const width = max / binCount;
  const edges = Array.from({ length: binCount + 1 }, (_, k) => k * width);
  const counts = new Array<number>(binCount).fill(0);
  const binOf = new Array<number>(amounts.length);
  for (let i = 0; i < amounts.length; i++) {
    const bin = Math.min(binCount - 1, Math.floor(amounts[i] / width));
    counts[bin]++;
    binOf[i] = bin;
  }
  return { edges, counts, binOf };
}

export interface LogBinning {
  /** Agents below `floor` dollars: no spot on a multiplying ruler. */
  readonly dustCount: number;
  readonly dustOf: boolean[];
  /** Decade edges: floor · 10^k, covering every non-dust agent. */
  readonly edges: number[];
  readonly counts: number[];
  readonly binOf: number[];
}

export function logBins(amounts: ArrayLike<number>, floor: number): LogBinning {
  if (!Number.isFinite(floor) || floor <= 0) throw new RangeError('floor must be positive');
  let max = 0;
  for (let i = 0; i < amounts.length; i++) max = Math.max(max, amounts[i]);
  const decades = Math.max(1, Math.ceil(Math.log10(Math.max(max, floor * 10) / floor) - 1e-9));
  const edges = Array.from({ length: decades + 1 }, (_, k) => floor * 10 ** k);
  const counts = new Array<number>(decades).fill(0);
  const binOf = new Array<number>(amounts.length).fill(-1);
  const dustOf = new Array<boolean>(amounts.length).fill(false);
  let dustCount = 0;
  for (let i = 0; i < amounts.length; i++) {
    if (amounts[i] < floor) {
      dustCount++;
      dustOf[i] = true;
      continue;
    }
    const bin = Math.min(decades - 1, Math.floor(Math.log10(amounts[i] / floor)));
    counts[bin]++;
    binOf[i] = bin;
  }
  return { dustCount, dustOf, edges, counts, binOf };
}

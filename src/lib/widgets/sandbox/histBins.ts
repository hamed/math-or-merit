/**
 * Sandbox histogram binning (owner review 2026-07-14): a FIXED range with a
 * chosen bin count, so adjacent empty bins are visible around the initial
 * spike. Geometric bins for the log axis, plain bins for the linear one.
 * The distribution chapter keeps its own decade binning (distribution/binning).
 */

export interface HistBins {
  /** binCount + 1 ascending edges. */
  readonly edges: number[];
  readonly counts: number[];
  /** Values below edges[0] (log mode only — zeros have no log home). */
  readonly underCount: number;
}

/** Geometric (log-spaced) bins over [lo, hi]; values above hi stretch hi first. */
export function geometricBins(amounts: ArrayLike<number>, lo: number, hi: number, binCount: number): HistBins {
  if (!(lo > 0) || !(hi > lo)) throw new RangeError('need 0 < lo < hi');
  if (!Number.isSafeInteger(binCount) || binCount < 1) throw new RangeError('binCount must be a positive integer');
  const logLo = Math.log10(lo);
  const span = Math.log10(hi) - logLo;
  const edges = Array.from({ length: binCount + 1 }, (_, k) => 10 ** (logLo + (span * k) / binCount));
  const counts = new Array<number>(binCount).fill(0);
  let underCount = 0;
  for (let i = 0; i < amounts.length; i++) {
    const v = amounts[i];
    if (!(v > 0) || v < lo) {
      underCount++;
      continue;
    }
    const bin = Math.min(binCount - 1, Math.floor(((Math.log10(v) - logLo) / span) * binCount));
    counts[bin]++;
  }
  return { edges, counts, underCount };
}

/** Equal-width bins over [0, hi]. Everything ≤ hi lands in a bin. */
export function rangedLinearBins(amounts: ArrayLike<number>, hi: number, binCount: number): HistBins {
  if (!(hi > 0)) throw new RangeError('hi must be positive');
  if (!Number.isSafeInteger(binCount) || binCount < 1) throw new RangeError('binCount must be a positive integer');
  const width = hi / binCount;
  const edges = Array.from({ length: binCount + 1 }, (_, k) => k * width);
  const counts = new Array<number>(binCount).fill(0);
  for (let i = 0; i < amounts.length; i++) {
    const bin = Math.min(binCount - 1, Math.max(0, Math.floor(amounts[i] / width)));
    counts[bin]++;
  }
  return { edges, counts, underCount: 0 };
}

/**
 * Sticky range keeper: grows the moment data leaves the range, shrinks back
 * only after the data has fit the tighter range for `holdMs` (no jitter —
 * owner review 2026-07-13).
 */
export class StickyRange {
  private lo: number;
  private hi: number;
  private pendingSince = 0;
  constructor(
    private readonly initialLo: number,
    private readonly initialHi: number,
    private readonly holdMs = 3500,
  ) {
    this.lo = initialLo;
    this.hi = initialHi;
  }

  update(dataLo: number, dataHi: number, now: number): { lo: number; hi: number } {
    const wantLo = Math.min(this.initialLo, dataLo);
    const wantHi = Math.max(this.initialHi, dataHi);
    if (wantLo < this.lo || wantHi > this.hi) {
      this.lo = Math.min(this.lo, wantLo);
      this.hi = Math.max(this.hi, wantHi);
      this.pendingSince = 0;
      return { lo: this.lo, hi: this.hi };
    }
    if (wantLo > this.lo || wantHi < this.hi) {
      if (this.pendingSince === 0) this.pendingSince = now;
      else if (now - this.pendingSince > this.holdMs) {
        this.lo = wantLo;
        this.hi = wantHi;
        this.pendingSince = 0;
      }
    } else {
      this.pendingSince = 0;
    }
    return { lo: this.lo, hi: this.hi };
  }

  reset(): void {
    this.lo = this.initialLo;
    this.hi = this.initialHi;
    this.pendingSince = 0;
  }
}

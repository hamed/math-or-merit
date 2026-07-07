import { createRandomSource, type RandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
import { applyFlatWealthLevy, applyProgressiveWealthLevy, type ProgressiveBracket } from '$lib/research';

export type TaxMode = 'off' | 'flat' | 'progressive';

export interface SandboxConfig {
  readonly n: number;
  readonly seed?: number;
  /** Dollars per head at the start; the room's total is n × this. */
  readonly startDollars: number;
}

/**
 * The full-toy world behind the sandbox: yard-sale trades over shares that
 * always sum to 1, plus a `totalDollars` scalar for display and for
 * dollar-denominated brackets.
 *
 * - Flat levy: proportional, scale-free — applied on shares directly.
 * - Progressive levy: brackets are DOLLAR thresholds; liabilities are
 *   computed on share × totalDollars, redistributed equally, shares
 *   renormalized. Conserves the total.
 * - Interest: totalDollars ×= (1 + r) — a uniform return on capital changes
 *   what a share is WORTH, not who holds it; its bite appears through the
 *   dollar brackets (a growing total pushes more agents over thresholds).
 *
 * SimEngine/SimConfig stay untouched (ADR-002); this composes primitives.
 */
export class SandboxWorld {
  readonly config: SandboxConfig;
  private readonly _wealth: Float64Array;
  private readonly random: RandomSource;
  private _totalDollars: number;
  private _trades = 0;
  private _leviedDollars = 0;

  /** Live-tunable dials (the sandbox UI writes these directly). */
  beta = 0.2;
  taxMode: TaxMode = 'off';
  flatRate = 0.02;
  brackets: readonly ProgressiveBracket[] = [];
  /** Trades between levies (a "round" is n trades). */
  taxEvery = 100;
  /** Per-round capital return applied to the whole room. */
  interestRate = 0;
  interestEvery = 100;

  constructor(config: SandboxConfig) {
    const { n, startDollars } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(startDollars) || startDollars <= 0) throw new RangeError('startDollars must be positive');
    this.config = config;
    this._wealth = new Float64Array(n).fill(1 / n);
    this._totalDollars = n * startDollars;
    this.random = createRandomSource(config.seed);
  }

  get wealth(): Float64Array {
    return this._wealth;
  }

  get totalDollars(): number {
    return this._totalDollars;
  }

  get trades(): number {
    return this._trades;
  }

  /** Dollars moved by levies so far (all returned as equal dividends). */
  get leviedDollars(): number {
    return this._leviedDollars;
  }

  dollarsOf(index: number): number {
    return this._wealth[index] * this._totalDollars;
  }

  step(trades: number): void {
    if (!Number.isSafeInteger(trades) || trades < 0) throw new RangeError('trades must be non-negative');
    const n = this.config.n;
    const w = this._wealth;
    const beta = Math.min(1, Math.max(0, this.beta));
    for (let t = 0; t < trades; t++) {
      this._trades++;
      if (beta > 0) {
        const a = Math.floor(this.random.next() * n);
        let b = Math.floor(this.random.next() * (n - 1));
        if (b >= a) b++;
        applyYardSaleTrade(w, a, b, beta, this.random.next() < 0.5);
      }
      if (this._trades % this.taxEvery === 0) this.applyLevy();
      if (this.interestRate > 0 && this._trades % this.interestEvery === 0) {
        this._totalDollars *= 1 + this.interestRate;
      }
    }
  }

  private applyLevy(): void {
    if (this.taxMode === 'flat' && this.flatRate > 0) {
      const revenueShare = applyFlatWealthLevy(this._wealth, this.flatRate);
      this._leviedDollars += revenueShare * this._totalDollars;
      return;
    }
    if (this.taxMode === 'progressive' && this.brackets.length > 0) {
      // work in dollars so the bracket thresholds mean what they say
      const dollars = new Float64Array(this._wealth.length);
      for (let i = 0; i < dollars.length; i++) dollars[i] = this._wealth[i] * this._totalDollars;
      const revenue = applyProgressiveWealthLevy(dollars, this.brackets);
      this._leviedDollars += revenue;
      // redistribution conserves the total; renormalize back to shares
      for (let i = 0; i < dollars.length; i++) this._wealth[i] = dollars[i] / this._totalDollars;
    }
  }

  reset(): void {
    this.random.reset();
    this._wealth.fill(1 / this.config.n);
    this._totalDollars = this.config.n * this.config.startDollars;
    this._trades = 0;
    this._leviedDollars = 0;
  }
}

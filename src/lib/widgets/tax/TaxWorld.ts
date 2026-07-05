import { createRandomSource, type RandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
import { applyTargetedWealthLevy } from '$lib/research';

export interface TaxWorldConfig {
  readonly n: number;
  readonly beta: number;
  readonly seed?: number;
}

/**
 * The live room for the manual-levy game (beat 19): fair yard-sale trades the
 * reader cannot stop, plus a targeted WEALTH levy on tap — the levied amount
 * is shared back equally across the room. Headless and unit-testable.
 */
export class TaxWorld {
  readonly config: TaxWorldConfig;
  private readonly _wealth: Float64Array;
  private readonly random: RandomSource;
  private _trades = 0;
  private _revenue = 0;

  constructor(config: TaxWorldConfig) {
    const { n, beta } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(beta) || beta < 0 || beta > 1) throw new RangeError('beta must be between 0 and 1');
    this.config = config;
    this._wealth = new Float64Array(n).fill(1 / n);
    this.random = createRandomSource(config.seed);
  }

  get wealth(): Float64Array {
    return this._wealth;
  }

  get trades(): number {
    return this._trades;
  }

  /** Total wealth pulled out by levies so far (it all went back in as dividends). */
  get leviedTotal(): number {
    return this._revenue;
  }

  step(trades: number): void {
    if (!Number.isSafeInteger(trades) || trades < 0) throw new RangeError('trades must be non-negative');
    const n = this.config.n;
    const w = this._wealth;
    for (let t = 0; t < trades; t++) {
      const a = Math.floor(this.random.next() * n);
      let b = Math.floor(this.random.next() * (n - 1));
      if (b >= a) b++;
      applyYardSaleTrade(w, a, b, this.config.beta, this.random.next() < 0.5);
    }
    this._trades += trades;
  }

  /** Tax one agent's current wealth at `rate`; returns the revenue collected. */
  levy(target: number, rate: number): number {
    const revenue = applyTargetedWealthLevy(this._wealth, target, rate);
    this._revenue += revenue;
    return revenue;
  }

  reset(): void {
    this.random.reset();
    this._wealth.fill(1 / this.config.n);
    this._trades = 0;
    this._revenue = 0;
  }
}

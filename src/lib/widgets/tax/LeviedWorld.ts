import { createRandomSource, type RandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
import { applyFlatWealthLevy } from '$lib/research';

export interface LeviedWorldConfig {
  readonly n: number;
  /** Stake per trade; 0 turns trading off (the tax-only demo). */
  readonly beta: number;
  /** Flat wealth-levy rate applied every `levyEvery` trades/ticks. */
  readonly taxRate: number;
  readonly levyEvery: number;
  readonly seed?: number;
  /** Optional unequal start (shares; copied and normalized to sum 1). */
  readonly initialWealth?: ArrayLike<number>;
}

/**
 * A room with an automatic structural levy: fair trades interleaved with a
 * flat wealth levy every `levyEvery` ticks, revenue shared back equally.
 * With beta = 0 nothing trades and the levy alone equalizes geometrically —
 * the tax-only demo. Headless, TaxWorld pattern.
 */
export class LeviedWorld {
  readonly config: LeviedWorldConfig;
  private readonly _wealth: Float64Array;
  private readonly _initial: Float64Array;
  private readonly random: RandomSource;
  private _ticks = 0;

  constructor(config: LeviedWorldConfig) {
    const { n, beta, taxRate, levyEvery } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(beta) || beta < 0 || beta > 1) throw new RangeError('beta must be between 0 and 1');
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) throw new RangeError('taxRate must be between 0 and 1');
    if (!Number.isSafeInteger(levyEvery) || levyEvery < 1) throw new RangeError('levyEvery must be a positive integer');
    this.config = config;

    if (config.initialWealth) {
      if (config.initialWealth.length !== n) throw new RangeError('initialWealth must have length n');
      const copy = Float64Array.from(config.initialWealth as ArrayLike<number>);
      let total = 0;
      for (let i = 0; i < n; i++) total += copy[i];
      if (!(total > 0)) throw new RangeError('initialWealth must have positive total');
      for (let i = 0; i < n; i++) copy[i] /= total;
      this._initial = copy;
    } else {
      this._initial = new Float64Array(n).fill(1 / n);
    }
    this._wealth = Float64Array.from(this._initial);
    this.random = createRandomSource(config.seed);
  }

  get wealth(): Float64Array {
    return this._wealth;
  }

  get ticks(): number {
    return this._ticks;
  }

  /** Advance `count` ticks; each tick is one trade (if beta > 0) plus the periodic levy. */
  step(count: number): void {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be non-negative');
    const { n, beta, taxRate, levyEvery } = this.config;
    const w = this._wealth;
    for (let t = 0; t < count; t++) {
      this._ticks++;
      if (beta > 0) {
        const a = Math.floor(this.random.next() * n);
        let b = Math.floor(this.random.next() * (n - 1));
        if (b >= a) b++;
        applyYardSaleTrade(w, a, b, beta, this.random.next() < 0.5);
      }
      if (taxRate > 0 && this._ticks % levyEvery === 0) applyFlatWealthLevy(w, taxRate);
    }
  }

  reset(): void {
    this.random.reset();
    this._wealth.set(this._initial);
    this._ticks = 0;
  }
}

import { createRandomSource, type RandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
import { applyTargetedWealthLevy } from '$lib/research';

export interface TaxWorldConfig {
  readonly n: number;
  readonly beta: number;
  readonly seed?: number;
  /** Stake increase applied on every levy — the game gets harder as you play. */
  readonly escalationPerLevy?: number;
  /** Stake ceiling for the escalation (default 0.5). */
  readonly betaMax?: number;
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
  private _beta: number;

  constructor(config: TaxWorldConfig) {
    const { n, beta, escalationPerLevy = 0, betaMax = 0.5 } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(beta) || beta < 0 || beta > 1) throw new RangeError('beta must be between 0 and 1');
    if (!Number.isFinite(escalationPerLevy) || escalationPerLevy < 0) {
      throw new RangeError('escalationPerLevy must be non-negative');
    }
    if (!Number.isFinite(betaMax) || betaMax < beta || betaMax > 1) {
      throw new RangeError('betaMax must be between beta and 1');
    }
    this.config = config;
    this._beta = beta;
    this._wealth = new Float64Array(n).fill(1 / n);
    this.random = createRandomSource(config.seed);
  }

  get wealth(): Float64Array {
    return this._wealth;
  }

  get trades(): number {
    return this._trades;
  }

  /** The current stake — rises with every levy when escalation is on. */
  get beta(): number {
    return this._beta;
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
      applyYardSaleTrade(w, a, b, this._beta, this.random.next() < 0.5);
    }
    this._trades += trades;
  }

  /**
   * Tax one agent's current wealth at `rate`; returns the revenue collected.
   * Each levy also escalates the stake (clamped to betaMax): every use of the
   * tool makes the room trade harder.
   */
  levy(target: number, rate: number): number {
    const revenue = applyTargetedWealthLevy(this._wealth, target, rate);
    this._revenue += revenue;
    this._beta = Math.min(this.config.betaMax ?? 0.5, this._beta + (this.config.escalationPerLevy ?? 0));
    return revenue;
  }

  reset(): void {
    this.random.reset();
    this._wealth.fill(1 / this.config.n);
    this._trades = 0;
    this._revenue = 0;
    this._beta = this.config.beta;
  }
}

/**
 * Pure game judge: the reader has lost once the top share has stayed above
 * `threshold` for the last `sustain` consecutive samples. Sampled once per
 * frame by the widget; unit-testable on synthetic histories.
 */
export function judgeGame(topShares: readonly number[], threshold = 0.35, sustain = 180): boolean {
  if (topShares.length < sustain) return false;
  for (let i = topShares.length - sustain; i < topShares.length; i++) {
    if (topShares[i] <= threshold) return false;
  }
  return true;
}

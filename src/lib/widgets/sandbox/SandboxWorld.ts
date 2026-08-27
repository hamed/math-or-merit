import { createRandomSource, type RandomSource } from '$lib/sim';
import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';

/**
 * Chaos-tolerant Gini + top share. The research metrics validate their
 * inputs (rightly); the sandbox in expert mode produces negative wealth on
 * purpose and still wants numbers on screen. Non-finite input → NaN.
 */
export function measureToy(wealth: ArrayLike<number>): { gini: number; topShare: number } {
  const n = wealth.length;
  const sorted = new Float64Array(n);
  let sum = 0;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = wealth[i];
    if (!Number.isFinite(v)) return { gini: NaN, topShare: NaN };
    sorted[i] = v;
    sum += v;
    if (v > max) max = v;
  }
  if (sum === 0) return { gini: NaN, topShare: NaN };
  sorted.sort();
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (i + 1) * sorted[i];
  return { gini: (2 * weighted) / (n * sum) - (n + 1) / n, topShare: max / sum };
}

export interface SandboxConfig {
  readonly n: number;
  readonly seed?: number;
  /** Dollars per head at the start; the room's total is n × this. */
  readonly startDollars: number;
  /**
   * Optional unequal start (shares; copied and normalized to sum 1). The
   * tax-only demo hands the room the reader just condensed; everything else
   * starts flat.
   */
  readonly initialWealth?: ArrayLike<number>;
}

/** Agents whose personal trajectories the world records (the spaghetti plot). */
export const TRACKED_AGENTS = 10;

/**
 * A per-round series anchored at round 1 — NEVER a moving window (owner
 * review 2026-07-14: "moving window only shows us the steady state").
 * When it fills up, adjacent pairs are averaged and the stride doubles, so
 * memory stays bounded while the whole history keeps its shape.
 */
export class RoundSeries {
  private static readonly CAP = 1024;
  private _values: number[] = [];
  private _stride = 1;
  private _carry: number | null = null;

  /** Rounds per stored point. */
  get stride(): number {
    return this._stride;
  }

  get values(): readonly number[] {
    return this._values;
  }

  /** The round number (1-based) of stored point i. */
  roundOf(index: number): number {
    return (index + 1) * this._stride;
  }

  push(value: number): void {
    if (this._stride === 1) {
      this._values.push(value);
    } else if (this._carry === null) {
      this._carry = value;
      return;
    } else {
      this._values.push((this._carry + value) / 2);
      this._carry = null;
    }
    if (this._values.length >= RoundSeries.CAP) {
      const halved: number[] = [];
      for (let i = 0; i + 1 < this._values.length; i += 2) {
        halved.push((this._values[i] + this._values[i + 1]) / 2);
      }
      this._values = halved;
      this._stride *= 2;
    }
  }

  reset(): void {
    this._values = [];
    this._stride = 1;
    this._carry = null;
  }
}

/**
 * The full-toy world behind the sandbox: yard-sale trades over shares that
 * always sum to 1, plus a `totalDollars` scalar for display.
 *
 * - Levy: one flat per-round rate, 0 = off. Proportional, scale-free —
 *   applied on shares directly, revenue returned as equal dividends.
 *   (Owner review 2026-07-13: progressivity will arrive as a parametric
 *   rate-of-log-wealth function behind ONE dial — keep `applyLevy` the seam;
 *   no bracket tables come back.)
 * - Click levy: `levyAgent` takes a slice of one agent on demand (the
 *   sandbox's mini-game), same equal-dividend redistribution.
 * - Round series (owner review 2026-07-14): Gini, top share, dollars WON
 *   (trade volume, β·min summed), and TRACKED_AGENTS personal trajectories —
 *   all anchored at round 1 via RoundSeries.
 *
 * SimEngine/SimConfig stay untouched (ADR-002); this composes primitives.
 */
export class SandboxWorld {
  readonly config: SandboxConfig;
  private readonly _wealth: Float64Array;
  /** The start state, kept so `reset` returns to the same room. */
  private readonly _initial: Float64Array;
  private readonly random: RandomSource;
  private _totalDollars: number;
  private _trades = 0;
  private _rounds = 0;
  private _leviedDollars = 0;
  /** Share volume won by trade winners since the last round point. */
  private _volumeBucket = 0;

  readonly giniSeries = new RoundSeries();
  readonly topShareSeries = new RoundSeries();
  readonly volumeSeries = new RoundSeries();
  /** Personal wealth (in dollars) of TRACKED_AGENTS evenly-spread agents. */
  readonly agentSeries: readonly RoundSeries[];
  readonly trackedAgents: readonly number[];

  /**
   * Live-tunable dials (the sandbox UI writes these directly). DELIBERATELY
   * unclamped (owner review 2026-07-14): expert mode may set a negative tax
   * or a 250% stake — watching the math break is part of the lesson. The
   * sandbox ticker carries the watchdog that catches non-finite wealth.
   */
  beta = 0.2;
  /** Flat wealth levy per round; 0 = off. */
  taxRate = 0;
  /** Trades between levies (a "round" is n trades). */
  taxEvery = 100;

  constructor(config: SandboxConfig) {
    const { n, startDollars } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(startDollars) || startDollars <= 0) throw new RangeError('startDollars must be positive');
    this.config = config;
    if (config.initialWealth) {
      if (config.initialWealth.length !== n) throw new RangeError('initialWealth must have length n');
      const copy = Float64Array.from(config.initialWealth as ArrayLike<number>);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        // The START is validated even though the RUN is not: expert dials may
        // drive wealth negative, but a corrupt snapshot poisons the room before
        // anyone touches a dial (audit 2026-07-10, finding 10).
        if (!Number.isFinite(copy[i]) || copy[i] < 0) {
          throw new RangeError('initialWealth values must be finite and non-negative');
        }
        sum += copy[i];
      }
      if (!(sum > 0)) throw new RangeError('initialWealth must have positive total');
      for (let i = 0; i < n; i++) copy[i] /= sum;
      this._initial = copy;
    } else {
      this._initial = new Float64Array(n).fill(1 / n);
    }
    this._wealth = Float64Array.from(this._initial);
    this._totalDollars = n * startDollars;
    this.random = createRandomSource(config.seed);
    const k = Math.min(TRACKED_AGENTS, n);
    this.trackedAgents = Array.from({ length: k }, (_, i) => Math.floor((i * n) / k));
    this.agentSeries = this.trackedAgents.map(() => new RoundSeries());
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

  /** Completed rounds (one series point each). */
  get rounds(): number {
    return this._rounds;
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
    const beta = this.beta;
    for (let t = 0; t < trades; t++) {
      this._trades++;
      if (beta !== 0) {
        const a = Math.floor(this.random.next() * n);
        let b = Math.floor(this.random.next() * (n - 1));
        if (b >= a) b++;
        this._volumeBucket += beta * Math.min(w[a], w[b]);
        applyYardSaleTrade(w, a, b, beta, this.random.next() < 0.5);
      }
      if (this._trades % this.taxEvery === 0) this.endRound();
    }
  }

  /**
   * The mini-game: take `rate` of one agent's wealth, hand it back to the
   * whole room as an equal dividend. Returns the dollars collected.
   */
  levyAgent(index: number, rate: number): number {
    const w = this._wealth;
    if (!Number.isSafeInteger(index) || index < 0 || index >= w.length) throw new RangeError('index out of range');
    const takeShare = w[index] * rate;
    if (takeShare === 0) return 0;
    const dividend = takeShare / w.length;
    w[index] -= takeShare;
    for (let i = 0; i < w.length; i++) w[i] += dividend;
    const dollars = takeShare * this._totalDollars;
    this._leviedDollars += dollars;
    return dollars;
  }

  /**
   * Round boundary: apply the flat levy, then record every series point.
   * The levy is inlined rather than borrowed from research/ — the research
   * primitive validates rates to [0, 1], and this toy deliberately does not.
   * (A negative rate is a wealth-proportional subsidy, financed equally.)
   */
  private endRound(): void {
    const rate = this.taxRate;
    if (rate !== 0) {
      const w = this._wealth;
      let revenueShare = 0;
      for (let i = 0; i < w.length; i++) {
        const take = w[i] * rate;
        w[i] -= take;
        revenueShare += take;
      }
      const dividend = revenueShare / w.length;
      for (let i = 0; i < w.length; i++) w[i] += dividend;
      this._leviedDollars += revenueShare * this._totalDollars;
    }
    this._rounds++;
    const m = measureToy(this._wealth);
    this.giniSeries.push(m.gini);
    this.topShareSeries.push(m.topShare);
    this.volumeSeries.push(this._volumeBucket * this._totalDollars);
    this._volumeBucket = 0;
    for (let k = 0; k < this.trackedAgents.length; k++) {
      this.agentSeries[k].push(this._wealth[this.trackedAgents[k]] * this._totalDollars);
    }
  }

  reset(): void {
    this.random.reset();
    this._wealth.set(this._initial);
    this._totalDollars = this.config.n * this.config.startDollars;
    this._trades = 0;
    this._rounds = 0;
    this._leviedDollars = 0;
    this._volumeBucket = 0;
    this.giniSeries.reset();
    this.topShareSeries.reset();
    this.volumeSeries.reset();
    for (const s of this.agentSeries) s.reset();
  }
}

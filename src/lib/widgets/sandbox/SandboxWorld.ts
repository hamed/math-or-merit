import { applyYardSaleTrade, createRandomSource, type RandomSource } from '$lib/sim';

/**
 * Chaos-tolerant Gini + top share. The research metrics validate their
 * inputs (rightly); the sandbox in expert mode produces negative wealth on
 * purpose and still wants numbers on screen. Non-finite input → NaN.
 */
export interface ToyMetrics {
  readonly gini: number;
  readonly topShare: number;
  readonly effectiveParticipants: number;
}

export interface RoundMeasurement extends ToyMetrics {
  readonly round: number;
  readonly trades: number;
  readonly tradeVolumeDollars: number;
  readonly wealthTurnover: number;
  readonly levyFlowDollars: number;
  readonly levyFlow: number;
}

export function measureToy(wealth: ArrayLike<number>): ToyMetrics {
  const n = wealth.length;
  const sorted = new Float64Array(n);
  let sum = 0;
  let sumSquares = 0;
  let max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = wealth[i];
    if (!Number.isFinite(v)) return { gini: NaN, topShare: NaN, effectiveParticipants: NaN };
    sorted[i] = v;
    sum += v;
    sumSquares += v * v;
    if (v > max) max = v;
  }
  if (sum === 0 || sumSquares === 0) {
    return { gini: NaN, topShare: NaN, effectiveParticipants: NaN };
  }
  sorted.sort();
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (i + 1) * sorted[i];
  const gini = (2 * weighted) / (n * sum) - (n + 1) / n;
  return {
    gini: Math.abs(gini) < Number.EPSILON * n ? 0 : gini,
    topShare: max / sum,
    effectiveParticipants: (sum * sum) / sumSquares,
  };
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
  private _pendingSum = 0;
  private _pendingCount = 0;

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
    this._pendingSum += value;
    this._pendingCount++;
    if (this._pendingCount < this._stride) return;

    this._values.push(this._pendingSum / this._pendingCount);
    this._pendingSum = 0;
    this._pendingCount = 0;

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
    this._pendingSum = 0;
    this._pendingCount = 0;
  }
}

/**
 * The full-toy world behind the sandbox: yard-sale trades over shares that
 * always sum to 1, plus a `totalDollars` scalar for display.
 *
 * - Levy: one flat per-round rate, 0 = off. Proportional, scale-free —
 *   applied on shares directly, revenue returned as equal dividends.
 * - Click levy: `levyAgent` takes a slice of one agent on demand (the
 *   sandbox's mini-game), same equal-dividend redistribution.
 * - Round series: Gini, top share, dollars WON
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
  /** Share transferred by ordinary trades since the last measurement round. */
  private _tradeVolumeBucket = 0;
  /** Share collected by structural and manual levies since the last round. */
  private _levyFlowBucket = 0;
  private readonly measurementListeners = new Set<(measurement: RoundMeasurement) => void>();

  readonly giniSeries = new RoundSeries();
  readonly topShareSeries = new RoundSeries();
  readonly effectiveParticipantsSeries = new RoundSeries();
  /** Dollar value transferred through ordinary trades per measurement round. */
  readonly tradeVolumeSeries = new RoundSeries();
  /** Ordinary trade volume divided by total wealth; one means one roomful. */
  readonly wealthTurnoverSeries = new RoundSeries();
  /** Dollar value collected by all levy paths per measurement round. */
  readonly levyFlowSeries = new RoundSeries();
  /** Personal wealth (in dollars) of TRACKED_AGENTS evenly-spread agents. */
  readonly agentSeries: readonly RoundSeries[];
  readonly trackedAgents: readonly number[];

  /**
   * Live-tunable dials (the sandbox UI writes these directly). DELIBERATELY
   * unclamped: expert mode may set a negative tax
   * or a 250% stake — watching the math break is part of the lesson. The
   * sandbox ticker carries the watchdog that catches non-finite wealth.
   */
  beta = 0.2;
  /** Flat wealth levy per round; 0 = off. */
  taxRate = 0;
  /** The measurement clock. A normal round is one trade per participant. */
  tradesPerRound: number;
  /** The policy clock, expressed in measurement rounds. */
  levyEveryRounds = 1;

  constructor(config: SandboxConfig) {
    const { n, startDollars, seed } = config;
    if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(startDollars)) throw new RangeError('startDollars must be finite');
    if (config.initialWealth) {
      if (config.initialWealth.length !== n) throw new RangeError('initialWealth must have length n');
      const copy = Float64Array.from(config.initialWealth as ArrayLike<number>);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        // The START is validated even though the RUN is not: expert dials may
        // drive wealth negative, but a corrupt snapshot poisons the room before
        // anyone touches a dial.
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
    this.config = Object.freeze({
      n,
      startDollars,
      ...(seed === undefined ? {} : { seed }),
      ...(config.initialWealth ? { initialWealth: Object.freeze(Array.from(this._initial)) } : {}),
    });
    this._wealth = Float64Array.from(this._initial);
    this._totalDollars = n * startDollars;
    this.random = createRandomSource(seed);
    this.tradesPerRound = n;
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

  onMeasurement(listener: (measurement: RoundMeasurement) => void): () => void {
    this.measurementListeners.add(listener);
    return () => this.measurementListeners.delete(listener);
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
        this._tradeVolumeBucket += applyYardSaleTrade(w, a, b, beta, this.random.next() < 0.5);
      }
      const measurementDue =
        Number.isSafeInteger(this.tradesPerRound) &&
        this.tradesPerRound > 0 &&
        this._trades % this.tradesPerRound === 0;
      const levyInterval = this.tradesPerRound * this.levyEveryRounds;
      const levyDue =
        Number.isSafeInteger(levyInterval) &&
        levyInterval > 0 &&
        this._trades % levyInterval === 0;
      if (levyDue) this.applyStructuralLevy();
      if (measurementDue) this.endMeasurementRound();
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
    this._levyFlowBucket += takeShare;
    return dollars;
  }

  /** Apply the structural rule on its own clock. */
  private applyStructuralLevy(): void {
    const rate = this.taxRate;
    if (rate === 0) return;
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
    this._levyFlowBucket += revenueShare;
  }

  /** Record every metric on the fixed measurement clock. */
  private endMeasurementRound(): void {
    this._rounds++;
    const m = measureToy(this._wealth);
    const tradeVolumeDollars = this._tradeVolumeBucket * this._totalDollars;
    const levyFlowDollars = this._levyFlowBucket * this._totalDollars;
    this.giniSeries.push(m.gini);
    this.topShareSeries.push(m.topShare);
    this.effectiveParticipantsSeries.push(m.effectiveParticipants);
    this.tradeVolumeSeries.push(tradeVolumeDollars);
    this.wealthTurnoverSeries.push(this._tradeVolumeBucket);
    this.levyFlowSeries.push(levyFlowDollars);
    const measurement: RoundMeasurement = {
      ...m,
      round: this._rounds,
      trades: this._trades,
      tradeVolumeDollars,
      wealthTurnover: this._tradeVolumeBucket,
      levyFlowDollars,
      levyFlow: this._levyFlowBucket,
    };
    for (const listener of this.measurementListeners) listener(measurement);
    this._tradeVolumeBucket = 0;
    this._levyFlowBucket = 0;
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
    this._tradeVolumeBucket = 0;
    this._levyFlowBucket = 0;
    this.giniSeries.reset();
    this.topShareSeries.reset();
    this.effectiveParticipantsSeries.reset();
    this.tradeVolumeSeries.reset();
    this.wealthTurnoverSeries.reset();
    this.levyFlowSeries.reset();
    for (const s of this.agentSeries) s.reset();
  }
}

/**
 * Versioned finite-run outcomes for the stake-versus-levy experiment.
 *
 * The filename remains `phase.ts` until the later visible narrative rename,
 * but nothing here asserts phases or stationary regimes. One seed produces
 * one outcome bundle under one immutable protocol.
 */
import { applyYardSaleTrade, createRandomSource, type RandomSource } from '$lib/sim';
import { applyFlatWealthLevy } from './interventions';
import { measureWealth } from './metrics';

export const OUTCOME_PROTOCOL_VERSION = 2 as const;

export interface ExperimentProtocol {
  readonly version: typeof OUTCOME_PROTOCOL_VERSION;
  readonly n: number;
  /** Ordinary trades in one measurement round. */
  readonly tradesPerRound: number;
  /** Structural levy cadence, expressed in measurement rounds. */
  readonly levyEveryRounds: number;
  readonly trades: number;
  readonly burnIn: number;
  readonly tailSamples: number;
}

export interface OutcomeRunConfig extends ExperimentProtocol {
  readonly beta: number;
  readonly taxRate: number;
  readonly seed: number;
}

export interface OutcomeMeasurement {
  readonly gini: number;
  readonly topShare: number;
  readonly effectiveParticipants: number;
  /** Ordinary stake volume divided by total wealth per measurement round. */
  readonly wealthTurnover: number;
  /** Structural levy collected and returned, divided by total wealth per round. */
  readonly levyFlow: number;
}

export type OutcomeMetric = keyof OutcomeMeasurement;

export const GUIDED_OUTCOME_PROTOCOL: ExperimentProtocol = Object.freeze({
  version: OUTCOME_PROTOCOL_VERSION,
  n: 100,
  tradesPerRound: 100,
  levyEveryRounds: 1,
  trades: 200_000,
  burnIn: 120_000,
  tailSamples: 8,
});

function validateProtocol(config: OutcomeRunConfig): void {
  const integers: readonly [string, number][] = [
    ['n', config.n],
    ['tradesPerRound', config.tradesPerRound],
    ['levyEveryRounds', config.levyEveryRounds],
    ['trades', config.trades],
    ['burnIn', config.burnIn],
    ['tailSamples', config.tailSamples],
    ['seed', config.seed],
  ];
  for (const [name, value] of integers) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${name} must be a non-negative safe integer`);
    }
  }
  if (config.version !== OUTCOME_PROTOCOL_VERSION) throw new RangeError('unsupported outcome protocol version');
  if (config.n < 2) throw new RangeError('n must be at least 2');
  if (config.tradesPerRound < 1 || config.levyEveryRounds < 1) {
    throw new RangeError('measurement and levy cadence must be positive');
  }
  if (config.tailSamples < 1 || config.trades <= config.burnIn) {
    throw new RangeError('the outcome tail must contain at least one sample');
  }
  if (config.trades % config.tradesPerRound !== 0 || config.burnIn % config.tradesPerRound !== 0) {
    throw new RangeError('horizon and burn-in must end on measurement-round boundaries');
  }
  const tailTrades = config.trades - config.burnIn;
  if (tailTrades % config.tailSamples !== 0 || tailTrades / config.tailSamples % config.tradesPerRound !== 0) {
    throw new RangeError('tail checkpoints must align with measurement rounds');
  }
  if (!Number.isFinite(config.beta) || config.beta < 0 || config.beta > 1) {
    throw new RangeError('beta must be between 0 and 1');
  }
  if (!Number.isFinite(config.taxRate) || config.taxRate < 0 || config.taxRate > 1) {
    throw new RangeError('taxRate must be between 0 and 1');
  }
}

/** Incremental execution keeps browser frame batching out of the estimator. */
export class IncrementalOutcomeRun {
  readonly wealth: Float64Array;
  private readonly random: RandomSource;
  private readonly sampleEvery: number;
  private readonly sums = {
    gini: 0,
    topShare: 0,
    effectiveParticipants: 0,
    wealthTurnover: 0,
    levyFlow: 0,
  };
  private samples = 0;
  private completedTrades = 0;
  private tradeBucket = 0;
  private levyBucket = 0;

  constructor(readonly config: OutcomeRunConfig) {
    validateProtocol(config);
    this.wealth = new Float64Array(config.n).fill(1 / config.n);
    this.random = createRandomSource(config.seed);
    this.sampleEvery = (config.trades - config.burnIn) / config.tailSamples;
  }

  get trades(): number {
    return this.completedTrades;
  }

  get done(): boolean {
    return this.completedTrades >= this.config.trades;
  }

  step(count: number): boolean {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
    const { n, beta, taxRate, tradesPerRound, levyEveryRounds, trades, burnIn } = this.config;
    const levyEveryTrades = tradesPerRound * levyEveryRounds;
    const stop = Math.min(trades, this.completedTrades + count);

    while (this.completedTrades < stop) {
      const a = Math.floor(this.random.next() * n);
      let b = Math.floor(this.random.next() * (n - 1));
      if (b >= a) b++;
      this.tradeBucket += applyYardSaleTrade(this.wealth, a, b, beta, this.random.next() < 0.5);
      this.completedTrades++;

      if (taxRate > 0 && this.completedTrades % levyEveryTrades === 0) {
        this.levyBucket += applyFlatWealthLevy(this.wealth, taxRate);
      }

      if (this.completedTrades % tradesPerRound !== 0) continue;
      if (this.completedTrades > burnIn && (this.completedTrades - burnIn) % this.sampleEvery === 0) {
        const measured = measureWealth(this.wealth);
        this.sums.gini += measured.gini;
        this.sums.topShare += measured.topShare;
        this.sums.effectiveParticipants += measured.effectiveParticipants;
        this.sums.wealthTurnover += this.tradeBucket;
        this.sums.levyFlow += this.levyBucket;
        this.samples++;
      }
      this.tradeBucket = 0;
      this.levyBucket = 0;
    }
    return this.done;
  }

  result(): OutcomeMeasurement {
    if (!this.done) throw new Error('outcome run is not complete');
    if (this.samples !== this.config.tailSamples) {
      throw new Error(`outcome run recorded ${this.samples} of ${this.config.tailSamples} samples`);
    }
    return {
      gini: this.sums.gini / this.samples,
      topShare: this.sums.topShare / this.samples,
      effectiveParticipants: this.sums.effectiveParticipants / this.samples,
      wealthTurnover: this.sums.wealthTurnover / this.samples,
      levyFlow: this.sums.levyFlow / this.samples,
    };
  }
}

export function runOutcome(config: OutcomeRunConfig): OutcomeMeasurement {
  const run = new IncrementalOutcomeRun(config);
  run.step(config.trades);
  return run.result();
}

export interface ContourSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** Marching squares over a continuous measured field. */
export function contourSegments(
  grid: readonly (readonly number[])[],
  xs: readonly number[],
  ys: readonly number[],
  level: number,
): ContourSegment[] {
  const segments: ContourSegment[] = [];
  const lerp = (a: number, b: number, va: number, vb: number) =>
    vb === va ? (a + b) / 2 : a + ((level - va) / (vb - va)) * (b - a);

  for (let iy = 0; iy < ys.length - 1; iy++) {
    for (let ix = 0; ix < xs.length - 1; ix++) {
      const v00 = grid[iy][ix];
      const v10 = grid[iy][ix + 1];
      const v01 = grid[iy + 1][ix];
      const v11 = grid[iy + 1][ix + 1];
      let caseId = 0;
      if (v00 > level) caseId |= 1;
      if (v10 > level) caseId |= 2;
      if (v11 > level) caseId |= 4;
      if (v01 > level) caseId |= 8;
      if (caseId === 0 || caseId === 15) continue;

      const bottom = { x: lerp(xs[ix], xs[ix + 1], v00, v10), y: ys[iy] };
      const top = { x: lerp(xs[ix], xs[ix + 1], v01, v11), y: ys[iy + 1] };
      const left = { x: xs[ix], y: lerp(ys[iy], ys[iy + 1], v00, v01) };
      const right = { x: xs[ix + 1], y: lerp(ys[iy], ys[iy + 1], v10, v11) };
      const push = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });

      switch (caseId) {
        case 1: case 14: push(left, bottom); break;
        case 2: case 13: push(bottom, right); break;
        case 3: case 12: push(left, right); break;
        case 4: case 11: push(top, right); break;
        case 5: push(left, top); push(bottom, right); break;
        case 6: case 9: push(bottom, top); break;
        case 7: case 8: push(left, top); break;
        case 10: push(left, bottom); push(top, right); break;
      }
    }
  }
  return segments;
}

export interface FittedSquareRelationship {
  /** tau(beta) = c * beta². */
  readonly c: number;
  readonly crossings: readonly { beta: number; tax: number }[];
}

export type OutcomeDirection = 'increases' | 'decreases';

/** Fit tau = c * beta² through a named iso-outcome contour. */
export function fitSquareRelationship(
  grid: readonly (readonly number[])[],
  betas: readonly number[],
  taxes: readonly number[],
  level: number,
  direction: OutcomeDirection,
): FittedSquareRelationship | null {
  const crossings: { beta: number; tax: number }[] = [];
  for (let ix = 0; ix < betas.length; ix++) {
    if (!(betas[ix] > 0)) continue;
    for (let iy = 0; iy < taxes.length - 1; iy++) {
      const a = grid[iy][ix];
      const b = grid[iy + 1][ix];
      const crossed = direction === 'increases'
        ? (a < level && b >= level) || (a <= level && b > level)
        : (a > level && b <= level) || (a >= level && b < level);
      if (!crossed) continue;
      const tax = taxes[iy] + ((level - a) / (b - a)) * (taxes[iy + 1] - taxes[iy]);
      crossings.push({ beta: betas[ix], tax });
      break;
    }
  }
  if (crossings.length < 2) return null;
  let numerator = 0;
  let denominator = 0;
  for (const { beta, tax } of crossings) {
    numerator += tax * beta * beta;
    denominator += beta ** 4;
  }
  return { c: numerator / denominator, crossings };
}

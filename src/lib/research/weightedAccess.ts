import { createRandomSource, type RandomSource } from '../sim';
import { applyYardSaleTrade } from '../sim/internal/YardSaleTrade';

export interface WeightedAccessConfig {
  readonly n: number;
  readonly beta: number;
  readonly seed: number;
  readonly accessExponent: number;
  readonly wealthOffset?: number;
}

export interface WeightedAccessState {
  readonly wealth: Readonly<Float64Array>;
  readonly encounters: Readonly<Uint32Array>;
  readonly step: number;
}

export class WeightedAccessYardSale {
  private readonly wealth: Float64Array;
  private readonly encounters: Uint32Array;
  private readonly random: RandomSource;
  private currentStep = 0;

  constructor(readonly config: WeightedAccessConfig) {
    if (!Number.isSafeInteger(config.n) || config.n < 2) throw new RangeError('n must be at least 2');
    if (!Number.isFinite(config.beta) || config.beta < 0 || config.beta > 1) throw new RangeError('beta must be between 0 and 1');
    if (!Number.isFinite(config.accessExponent) || config.accessExponent < 0) {
      throw new RangeError('accessExponent must be finite and non-negative');
    }
    if (config.wealthOffset !== undefined && (!Number.isFinite(config.wealthOffset) || config.wealthOffset <= 0)) {
      throw new RangeError('wealthOffset must be finite and positive');
    }
    this.wealth = new Float64Array(config.n).fill(1 / config.n);
    this.encounters = new Uint32Array(config.n);
    this.random = createRandomSource(config.seed);
  }

  get state(): WeightedAccessState {
    return { wealth: this.wealth, encounters: this.encounters, step: this.currentStep };
  }

  private selectAgent(excluded = -1): number {
    const offset = this.config.wealthOffset ?? Number.EPSILON;
    let maximum = 0;
    for (let i = 0; i < this.wealth.length; i++) {
      if (i !== excluded) maximum = Math.max(maximum, this.wealth[i] + offset);
    }
    // Scaling by the largest weight preserves probabilities and prevents underflow
    // when a large exponent is applied to small normalized wealth values.
    let total = 0;
    for (let i = 0; i < this.wealth.length; i++) {
      if (i !== excluded) total += ((this.wealth[i] + offset) / maximum) ** this.config.accessExponent;
    }
    let draw = this.random.next() * total;
    for (let i = 0; i < this.wealth.length; i++) {
      if (i === excluded) continue;
      draw -= ((this.wealth[i] + offset) / maximum) ** this.config.accessExponent;
      if (draw <= 0) return i;
    }
    return excluded === this.wealth.length - 1 ? this.wealth.length - 2 : this.wealth.length - 1;
  }

  step(steps = 1): void {
    if (!Number.isSafeInteger(steps) || steps < 0) throw new RangeError('steps must be non-negative');
    for (let s = 0; s < steps; s++) {
      const a = this.selectAgent();
      const b = this.selectAgent(a);
      applyYardSaleTrade(this.wealth, a, b, this.config.beta, this.random.next() < 0.5);
      this.encounters[a]++;
      this.encounters[b]++;
    }
    this.currentStep += steps;
  }

  reset(): void {
    this.wealth.fill(1 / this.config.n);
    this.encounters.fill(0);
    this.currentStep = 0;
    this.random.reset();
  }
}

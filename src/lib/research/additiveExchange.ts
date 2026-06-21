import { createRandomSource, type RandomSource } from '../sim';

export interface AdditiveExchangeConfig {
  readonly n: number;
  readonly seed: number;
}

/** Randomly reshuffles the selected pair's combined wealth. */
export class AdditiveExchangeEngine {
  private readonly wealth: Float64Array;
  private readonly random: RandomSource;
  private currentStep = 0;

  constructor(readonly config: AdditiveExchangeConfig) {
    if (!Number.isSafeInteger(config.n) || config.n < 2) throw new RangeError('n must be at least 2');
    this.wealth = new Float64Array(config.n).fill(1 / config.n);
    this.random = createRandomSource(config.seed);
  }

  get state(): { readonly wealth: Readonly<Float64Array>; readonly step: number } {
    return { wealth: this.wealth, step: this.currentStep };
  }

  step(steps = 1): void {
    if (!Number.isSafeInteger(steps) || steps < 0) throw new RangeError('steps must be non-negative');
    for (let s = 0; s < steps; s++) {
      const a = Math.floor(this.random.next() * this.config.n);
      let b = Math.floor(this.random.next() * (this.config.n - 1));
      if (b >= a) b++;
      const combined = this.wealth[a] + this.wealth[b];
      const share = this.random.next();
      this.wealth[a] = share * combined;
      this.wealth[b] = (1 - share) * combined;
    }
    this.currentStep += steps;
  }

  reset(): void {
    this.wealth.fill(1 / this.config.n);
    this.currentStep = 0;
    this.random.reset();
  }
}

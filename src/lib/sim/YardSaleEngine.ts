import type { SimConfig, SimEngine, SimState } from './SimEngine';
import { createRandomSource, type RandomSource } from './Random';
import { applyYardSaleTrade } from './YardSaleTrade';

export class YardSaleEngine implements SimEngine {
  readonly config: SimConfig;
  private readonly _wealth: Float64Array;
  private readonly random: RandomSource;
  private _step = 0;

  constructor(config: SimConfig) {
    const { n, beta, seed } = config;

    if (!Number.isSafeInteger(n) || n < 2) {
      throw new RangeError('n must be a safe integer greater than or equal to 2');
    }
    if (!Number.isFinite(beta) || beta < 0 || beta > 1) {
      throw new RangeError('beta must be a finite number between 0 and 1');
    }
    if (seed !== undefined && (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff)) {
      throw new RangeError('seed must be an unsigned 32-bit integer');
    }

    this.config = Object.freeze(seed === undefined ? { n, beta } : { n, beta, seed });
    this._wealth = new Float64Array(n);
    this.random = createRandomSource(seed);
    this._equalWealth();
  }

  get state(): SimState {
    return { wealth: this._wealth, step: this._step };
  }

  step(steps = 1): void {
    if (!Number.isSafeInteger(steps) || steps < 0) {
      throw new RangeError('steps must be a non-negative safe integer');
    }
    if (!Number.isSafeInteger(this._step + steps)) {
      throw new RangeError('step counter exceeds the safe integer range');
    }

    const { n, beta } = this.config;
    const w = this._wealth;

    for (let s = 0; s < steps; s++) {
      const i = Math.floor(this.random.next() * n);
      let j = Math.floor(this.random.next() * (n - 1));
      if (j >= i) j++;

      applyYardSaleTrade(w, i, j, beta, this.random.next() < 0.5);
    }

    this._step += steps;
  }

  reset(): void {
    this.random.reset();
    this._equalWealth();
    this._step = 0;
  }

  private _equalWealth(): void {
    this._wealth.fill(1.0 / this.config.n);
  }
}

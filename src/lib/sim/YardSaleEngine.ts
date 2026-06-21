import type { SimConfig, SimEngine, SimState } from './SimEngine';

export class YardSaleEngine implements SimEngine {
  readonly config: SimConfig;
  private readonly _wealth: Float64Array;
  private _step = 0;

  constructor(config: SimConfig) {
    this.config = config;
    this._wealth = new Float64Array(config.n);
    this._equalWealth();
  }

  get state(): SimState {
    return { wealth: this._wealth, step: this._step };
  }

  step(steps = 1): void {
    const { n, beta } = this.config;
    const w = this._wealth;

    for (let s = 0; s < steps; s++) {
      const i = (Math.random() * n) | 0;
      let j = (Math.random() * (n - 1)) | 0;
      if (j >= i) j++;

      const stake = beta * Math.min(w[i], w[j]);
      const sign = Math.random() < 0.5 ? 1 : -1;
      w[i] += sign * stake;
      w[j] -= sign * stake;
    }

    this._step += steps;
  }

  reset(): void {
    this._equalWealth();
    this._step = 0;
  }

  private _equalWealth(): void {
    this._wealth.fill(1.0 / this.config.n);
  }
}

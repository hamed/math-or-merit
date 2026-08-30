interface Observation {
  readonly key: string;
  readonly rounds: number;
  readonly gini: number;
}

/**
 * Turns live round/Gini observations into stable phase-map measurements.
 * It owns only the sampling window; persistence and simulation stay outside.
 */
export class SteadyStateTracker {
  private key = '';
  private accumulatedGini = 0;
  private accumulatedRounds = 0;
  private lastRound = 0;
  private means: number[] = [];

  constructor(
    private readonly windowRounds = 50,
    private readonly epsilon = 0.015,
  ) {}

  reset(): void {
    this.key = '';
    this.accumulatedGini = 0;
    this.accumulatedRounds = 0;
    this.lastRound = 0;
    this.means = [];
  }

  observe({ key, rounds, gini }: Observation): number | null {
    if (!Number.isFinite(gini)) return null;
    if (key !== this.key) {
      this.key = key;
      this.accumulatedGini = 0;
      this.accumulatedRounds = 0;
      this.means = [];
      this.lastRound = rounds;
      return null;
    }

    const delta = rounds - this.lastRound;
    if (delta <= 0) return null;
    this.lastRound = rounds;
    this.accumulatedGini += gini * delta;
    this.accumulatedRounds += delta;
    if (this.accumulatedRounds < this.windowRounds) return null;

    const mean = this.accumulatedGini / this.accumulatedRounds;
    this.accumulatedGini = 0;
    this.accumulatedRounds = 0;
    this.means.push(mean);
    const count = this.means.length;
    return count >= 2 && Math.abs(this.means[count - 1] - this.means[count - 2]) < this.epsilon
      ? mean
      : null;
  }
}

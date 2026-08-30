import type { ExperimentProtocol, OutcomeMeasurement } from '$lib/research';
import type { RoundMeasurement } from './SandboxWorld';

export interface OutcomeRunIdentity {
  readonly protocol: ExperimentProtocol;
  readonly beta: number;
  readonly taxRate: number;
  readonly seed: number;
}

export interface RecordedOutcome extends OutcomeRunIdentity {
  readonly outcome: OutcomeMeasurement;
}

/**
 * Turns one fresh sandbox room into at most one independent finite-run result.
 * Changing either rule or clock invalidates the room instead of silently
 * mixing protocols.
 */
export class OutcomeRunRecorder {
  private readonly sums = {
    gini: 0,
    topShare: 0,
    effectiveParticipants: 0,
    wealthTurnover: 0,
    levyFlow: 0,
  };
  private samples = 0;
  private finished = false;
  private invalid = false;

  constructor(readonly identity: OutcomeRunIdentity) {}

  observe(
    measurement: RoundMeasurement,
    current: {
      beta: number;
      taxRate: number;
      tradesPerRound: number;
      levyEveryRounds: number;
    },
  ): RecordedOutcome | null {
    if (this.finished || this.invalid) return null;
    const { protocol, beta, taxRate } = this.identity;
    if (
      !Number.isFinite(beta) || beta < 0 || beta > 1 ||
      !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1 ||
      current.beta !== beta || current.taxRate !== taxRate ||
      current.tradesPerRound !== protocol.tradesPerRound ||
      current.levyEveryRounds !== protocol.levyEveryRounds ||
      measurement.trades > protocol.trades
    ) {
      this.invalid = true;
      return null;
    }

    const sampleEvery = (protocol.trades - protocol.burnIn) / protocol.tailSamples;
    if (measurement.trades > protocol.burnIn && (measurement.trades - protocol.burnIn) % sampleEvery === 0) {
      this.sums.gini += measurement.gini;
      this.sums.topShare += measurement.topShare;
      this.sums.effectiveParticipants += measurement.effectiveParticipants;
      this.sums.wealthTurnover += measurement.wealthTurnover;
      this.sums.levyFlow += measurement.levyFlow;
      this.samples++;
    }

    if (measurement.trades !== protocol.trades) return null;
    this.finished = true;
    if (this.samples !== protocol.tailSamples) return null;
    const outcome: OutcomeMeasurement = {
      gini: this.sums.gini / this.samples,
      topShare: this.sums.topShare / this.samples,
      effectiveParticipants: this.sums.effectiveParticipants / this.samples,
      wealthTurnover: this.sums.wealthTurnover / this.samples,
      levyFlow: this.sums.levyFlow / this.samples,
    };
    if (!Object.values(outcome).every(Number.isFinite)) return null;
    return { ...this.identity, outcome };
  }
}

import {
  OUTCOME_PROTOCOL_VERSION,
  type ExperimentProtocol,
  type OutcomeRunConfig,
} from '$lib/research';

export const MATCHED_BETA = 0.2;
export const MATCHED_LEVY_RATE = 0.005;

export const MATCHED_PROTOCOL: ExperimentProtocol = Object.freeze({
  version: OUTCOME_PROTOCOL_VERSION,
  n: 100,
  tradesPerRound: 100,
  levyEveryRounds: 1,
  trades: 100_000,
  burnIn: 60_000,
  tailSamples: 4,
});

/** Same initial room, pairings, tosses, cadence, and horizon; only the levy differs. */
export function matchedRunConfigs(seed: number): readonly [OutcomeRunConfig, OutcomeRunConfig] {
  const shared = { ...MATCHED_PROTOCOL, beta: MATCHED_BETA, seed };
  return [
    { ...shared, taxRate: 0 },
    { ...shared, taxRate: MATCHED_LEVY_RATE },
  ];
}

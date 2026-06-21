import { createEngine, type SimConfig } from '../sim';
import { measureWealth, quantile, type WealthMetrics } from './metrics';

export interface BaselineRunConfig extends SimConfig {
  readonly seed: number;
  readonly checkpoints: readonly number[];
}

export interface CheckpointRecord extends WealthMetrics {
  readonly step: number;
  readonly tradesPerAgent: number;
}

export interface BaselineRunRecord {
  readonly config: BaselineRunConfig;
  readonly checkpoints: readonly CheckpointRecord[];
}

export interface IntervalSummary {
  readonly lower: number;
  readonly median: number;
  readonly upper: number;
}

export interface EnsembleCheckpoint {
  readonly step: number;
  readonly tradesPerAgent: number;
  readonly gini: IntervalSummary;
  readonly topShare: IntervalSummary;
  readonly effectiveParticipants: IntervalSummary;
}

function validateCheckpoints(checkpoints: readonly number[]): void {
  let previous = -1;
  for (const checkpoint of checkpoints) {
    if (!Number.isSafeInteger(checkpoint) || checkpoint < 0 || checkpoint <= previous) {
      throw new RangeError('checkpoints must be strictly increasing non-negative integers');
    }
    previous = checkpoint;
  }
}

export function runBaseline(config: BaselineRunConfig): BaselineRunRecord {
  validateCheckpoints(config.checkpoints);
  const engine = createEngine(config);
  const records: CheckpointRecord[] = [];

  for (const checkpoint of config.checkpoints) {
    engine.step(checkpoint - engine.state.step);
    records.push({
      step: checkpoint,
      tradesPerAgent: checkpoint / config.n,
      ...measureWealth(engine.state.wealth),
    });
  }
  return { config, checkpoints: records };
}

function interval(values: readonly number[]): IntervalSummary {
  return {
    lower: quantile(values, 0.05),
    median: quantile(values, 0.5),
    upper: quantile(values, 0.95),
  };
}

export function runBaselineEnsemble(
  config: Omit<BaselineRunConfig, 'seed'>,
  seeds: readonly number[],
): { readonly runs: readonly BaselineRunRecord[]; readonly summary: readonly EnsembleCheckpoint[] } {
  if (seeds.length === 0) throw new RangeError('seeds must not be empty');
  const runs = seeds.map((seed) => runBaseline({ ...config, seed }));
  const summary = config.checkpoints.map((step, index) => {
    const checkpoints = runs.map((run) => run.checkpoints[index]);
    return {
      step,
      tradesPerAgent: step / config.n,
      gini: interval(checkpoints.map((value) => value.gini)),
      topShare: interval(checkpoints.map((value) => value.topShare)),
      effectiveParticipants: interval(checkpoints.map((value) => value.effectiveParticipants)),
    };
  });
  return { runs, summary };
}

export function firstObservedConcentrationStep(
  config: Omit<BaselineRunConfig, 'checkpoints'>,
  threshold: number,
  maxSteps: number,
  sampleEvery = config.n,
): number | null {
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    throw new RangeError('threshold must be greater than zero and at most one');
  }
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 0) throw new RangeError('maxSteps must be non-negative');
  if (!Number.isSafeInteger(sampleEvery) || sampleEvery < 1) throw new RangeError('sampleEvery must be positive');
  const engine = createEngine(config);
  while (engine.state.step <= maxSteps) {
    if (measureWealth(engine.state.wealth).topShare >= threshold) return engine.state.step;
    const remaining = maxSteps - engine.state.step;
    if (remaining === 0) break;
    engine.step(Math.min(sampleEvery, remaining));
  }
  return null;
}

import { createEngine, type SimEngine } from '../../sim';
import { measureRankedWealth } from '../../research';

export interface BaselineWorld {
  readonly seed: number;
  readonly engine: SimEngine;
}

export interface BaselineWorldView {
  readonly seed: number;
  readonly step: number;
  readonly gini: number;
  readonly topShare: number;
  readonly effectiveParticipants: number;
  readonly rankedWealth: Float64Array;
  readonly maxWealth: number;
}

export interface BaselineWorldConfig {
  readonly n: number;
  readonly beta: number;
  readonly seeds: readonly number[];
}

export function createBaselineWorlds(config: BaselineWorldConfig): BaselineWorld[] {
  if (config.seeds.length === 0) throw new RangeError('seeds must not be empty');
  return config.seeds.map((seed) => ({
    seed,
    engine: createEngine({ n: config.n, beta: config.beta, seed }),
  }));
}

export function stepBaselineWorlds(worlds: readonly BaselineWorld[], steps: number): void {
  for (const world of worlds) world.engine.step(steps);
}

export function resetBaselineWorlds(worlds: readonly BaselineWorld[]): void {
  for (const world of worlds) world.engine.reset();
}

export function viewBaselineWorlds(worlds: readonly BaselineWorld[]): BaselineWorldView[] {
  if (worlds.length === 0) throw new RangeError('worlds must not be empty');
  return worlds.map(({ seed, engine }) => {
    const rankedWealth = Float64Array.from(engine.state.wealth).sort((a, b) => b - a);
    const metrics = measureRankedWealth(rankedWealth);
    return {
      seed,
      step: engine.state.step,
      gini: metrics.gini,
      topShare: metrics.topShare,
      effectiveParticipants: metrics.effectiveParticipants,
      rankedWealth,
      maxWealth: rankedWealth[0],
    };
  });
}

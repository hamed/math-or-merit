import { createEngine, type SimEngine } from '../../sim';
import { measureWealth } from '../../research';

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
  readonly rankedWealth: readonly number[];
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
  return worlds.map(({ seed, engine }) => {
    const rankedWealth = Array.from(engine.state.wealth).sort((a, b) => b - a);
    const metrics = measureWealth(rankedWealth);
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

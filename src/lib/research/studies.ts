import { createRandomSource } from '../sim';
import { applyYardSaleTrade } from '../sim/YardSaleTrade';
import { AdditiveExchangeEngine } from './additiveExchange';
import { measureWealth, type WealthMetrics } from './metrics';
import { localRichAgentIndices, StaticNetworkYardSale, type StaticNetworkConfig } from './network';
import {
  applyFlatWealthLevy,
  applyFlatWealthBudget,
  applyProgressiveWealthLevy,
  applyProgressiveWealthBudget,
  applyTargetedWealthLevy,
  applyTargetedWealthBudget,
  type ProgressiveBracket,
} from './interventions';
import { WeightedAccessYardSale, type WeightedAccessConfig } from './weightedAccess';

export interface StudyCheckpoint extends WealthMetrics {
  readonly step: number;
}

export interface NetworkStudyCheckpoint extends StudyCheckpoint {
  readonly localRichAgents: number;
  readonly neighborWealthCorrelation: number;
  readonly effectiveEncounterEdges: number;
  readonly encounterEdgeCoverage: number;
}

export interface WeightedAccessStudyCheckpoint extends StudyCheckpoint {
  readonly encounterWealthCorrelation: number;
  readonly effectiveEncounteredAgents: number;
}

function correlation(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < a.length; i++) {
    meanA += a[i] / a.length;
    meanB += b[i] / b.length;
  }
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let i = 0; i < a.length; i++) {
    const deltaA = a[i] - meanA;
    const deltaB = b[i] - meanB;
    covariance += deltaA * deltaB;
    varianceA += deltaA ** 2;
    varianceB += deltaB ** 2;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator === 0 ? 0 : covariance / denominator;
}

function effectiveCount(values: ArrayLike<number>): number {
  let total = 0;
  let squares = 0;
  for (let i = 0; i < values.length; i++) {
    total += values[i];
    squares += values[i] ** 2;
  }
  return squares === 0 ? 0 : total ** 2 / squares;
}

function validateStudyCheckpoints(checkpoints: readonly number[]): void {
  let previous = -1;
  for (const checkpoint of checkpoints) {
    if (!Number.isSafeInteger(checkpoint) || checkpoint < 0 || checkpoint <= previous) {
      throw new RangeError('checkpoints must be strictly increasing non-negative integers');
    }
    previous = checkpoint;
  }
}

export function runNetworkStudy(
  config: StaticNetworkConfig,
  checkpoints: readonly number[],
): NetworkStudyCheckpoint[] {
  validateStudyCheckpoints(checkpoints);
  const engine = new StaticNetworkYardSale(config);
  return checkpoints.map((step) => {
    engine.step(step - engine.state.step);
    const endpointA: number[] = [];
    const endpointB: number[] = [];
    for (const [a, b] of config.edges) {
      endpointA.push(engine.state.wealth[a], engine.state.wealth[b]);
      endpointB.push(engine.state.wealth[b], engine.state.wealth[a]);
    }
    const encounteredEdges = Array.from(engine.state.edgeEncounters).filter((count) => count > 0).length;
    return {
      step,
      ...measureWealth(engine.state.wealth),
      localRichAgents: localRichAgentIndices(engine.state.wealth, config.edges).length,
      neighborWealthCorrelation: correlation(endpointA, endpointB),
      effectiveEncounterEdges: effectiveCount(engine.state.edgeEncounters),
      encounterEdgeCoverage: encounteredEdges / config.edges.length,
    };
  });
}

export function runWeightedAccessStudy(
  config: WeightedAccessConfig,
  checkpoints: readonly number[],
): WeightedAccessStudyCheckpoint[] {
  validateStudyCheckpoints(checkpoints);
  const engine = new WeightedAccessYardSale(config);
  return checkpoints.map((step) => {
    engine.step(step - engine.state.step);
    return {
      step,
      ...measureWealth(engine.state.wealth),
      encounterWealthCorrelation: correlation(engine.state.wealth, engine.state.encounters),
      effectiveEncounteredAgents: effectiveCount(engine.state.encounters),
    };
  });
}

export function runAdditiveStudy(
  n: number,
  seed: number,
  checkpoints: readonly number[],
): StudyCheckpoint[] {
  validateStudyCheckpoints(checkpoints);
  const engine = new AdditiveExchangeEngine({ n, seed });
  return checkpoints.map((step) => {
    engine.step(step - engine.state.step);
    return { step, ...measureWealth(engine.state.wealth) };
  });
}

interface InterventionStudyConfig {
  readonly n: number;
  readonly beta: number;
  readonly seed: number;
  readonly cycles: number;
  readonly tradesPerCycle: number;
}

export interface InterventionCheckpoint extends StudyCheckpoint {
  readonly cycle: number;
  readonly cumulativeRevenue: number;
}

type Levy = (wealth: Float64Array) => number;

function runLevyStudy(config: InterventionStudyConfig, levy: Levy): InterventionCheckpoint[] {
  const { n, beta, seed, cycles, tradesPerCycle } = config;
  if (!Number.isSafeInteger(n) || n < 2) throw new RangeError('n must be at least 2');
  if (!Number.isFinite(beta) || beta < 0 || beta > 1) throw new RangeError('beta must be between 0 and 1');
  if (!Number.isSafeInteger(cycles) || cycles < 1) throw new RangeError('cycles must be positive');
  if (!Number.isSafeInteger(tradesPerCycle) || tradesPerCycle < 1) throw new RangeError('tradesPerCycle must be positive');

  const wealth = new Float64Array(n).fill(1 / n);
  const random = createRandomSource(seed);
  const checkpoints: InterventionCheckpoint[] = [];
  let cumulativeRevenue = 0;
  let step = 0;

  for (let cycle = 1; cycle <= cycles; cycle++) {
    for (let trade = 0; trade < tradesPerCycle; trade++) {
      const a = Math.floor(random.next() * n);
      let b = Math.floor(random.next() * (n - 1));
      if (b >= a) b++;
      applyYardSaleTrade(wealth, a, b, beta, random.next() < 0.5);
      step++;
    }
    cumulativeRevenue += levy(wealth);
    checkpoints.push({ cycle, step, cumulativeRevenue, ...measureWealth(wealth) });
  }
  return checkpoints;
}

export function runManualRichestLevyStudy(
  config: InterventionStudyConfig,
  rate: number,
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => {
    let richest = 0;
    for (let i = 1; i < wealth.length; i++) if (wealth[i] > wealth[richest]) richest = i;
    return applyTargetedWealthLevy(wealth, richest, rate);
  });
}

export function runFlatLevyStudy(
  config: InterventionStudyConfig,
  rate: number,
  exemption = 0,
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => applyFlatWealthLevy(wealth, rate, exemption));
}

export function runProgressiveLevyStudy(
  config: InterventionStudyConfig,
  brackets: readonly ProgressiveBracket[],
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => applyProgressiveWealthLevy(wealth, brackets));
}

export function runManualRichestBudgetStudy(
  config: InterventionStudyConfig,
  budgetPerCycle: number,
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => {
    let richest = 0;
    for (let i = 1; i < wealth.length; i++) if (wealth[i] > wealth[richest]) richest = i;
    return applyTargetedWealthBudget(wealth, richest, budgetPerCycle);
  });
}

export function runFlatBudgetStudy(
  config: InterventionStudyConfig,
  budgetPerCycle: number,
  exemption = 0,
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => applyFlatWealthBudget(wealth, budgetPerCycle, exemption));
}

export function runProgressiveBudgetStudy(
  config: InterventionStudyConfig,
  budgetPerCycle: number,
  brackets: readonly ProgressiveBracket[],
): InterventionCheckpoint[] {
  return runLevyStudy(config, (wealth) => applyProgressiveWealthBudget(wealth, budgetPerCycle, brackets));
}

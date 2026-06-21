import { describe, expect, it } from 'vitest';
import { ringGraph } from './network';
import {
  runAdditiveStudy,
  runFlatBudgetStudy,
  runFlatLevyStudy,
  runManualRichestBudgetStudy,
  runManualRichestLevyStudy,
  runNetworkStudy,
  runProgressiveBudgetStudy,
  runProgressiveLevyStudy,
  runWeightedAccessStudy,
} from './studies';

describe('research studies', () => {
  const checkpoints = [0, 100, 1_000] as const;

  it('runs network, access, and additive checkpoints', () => {
    const network = runNetworkStudy({ n: 10, beta: 0.25, seed: 1, edges: ringGraph(10) }, checkpoints);
    const access = runWeightedAccessStudy({ n: 10, beta: 0.25, seed: 1, accessExponent: 1 }, checkpoints);
    const additive = runAdditiveStudy(10, 1, checkpoints);

    for (const study of [network, access, additive]) {
      expect(study.map(({ step }) => step)).toEqual(checkpoints);
      expect(study.at(-1)!.totalWealth).toBeCloseTo(1);
    }
  });

  it('runs all three intervention protocols conservatively', () => {
    const config = { n: 10, beta: 0.25, seed: 2, cycles: 3, tradesPerCycle: 100 };
    const studies = [
      runManualRichestLevyStudy(config, 0.1),
      runFlatLevyStudy(config, 0.01),
      runProgressiveLevyStudy(config, [{ above: 0, rate: 0.01 }]),
    ];
    for (const study of studies) {
      expect(study).toHaveLength(3);
      expect(study.at(-1)!.totalWealth).toBeCloseTo(1);
      expect(study.at(-1)!.cumulativeRevenue).toBeGreaterThan(0);
    }
  });

  it('holds collection budget constant across intervention rules', () => {
    const config = { n: 10, beta: 0.25, seed: 2, cycles: 3, tradesPerCycle: 100 };
    const budget = 0.01;
    const studies = [
      runManualRichestBudgetStudy(config, budget),
      runFlatBudgetStudy(config, budget),
      runProgressiveBudgetStudy(config, budget, [{ above: 0, rate: 0.1 }]),
    ];
    for (const study of studies) expect(study.at(-1)!.cumulativeRevenue).toBeCloseTo(0.03);
  });
});

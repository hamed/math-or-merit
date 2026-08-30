import { describe, expect, it } from 'vitest';
import { OUTCOME_PROTOCOL_VERSION, runOutcome, type ExperimentProtocol } from '$lib/research';
import { OutcomeRunRecorder, type RecordedOutcome } from './OutcomeRunRecorder';
import { SandboxWorld } from './SandboxWorld';

const protocol: ExperimentProtocol = {
  version: OUTCOME_PROTOCOL_VERSION,
  n: 10,
  tradesPerRound: 10,
  levyEveryRounds: 2,
  trades: 200,
  burnIn: 100,
  tailSamples: 5,
};

function record(seed = 17, chunks: readonly number[] = [200]) {
  const world = new SandboxWorld({ n: protocol.n, seed, startDollars: 100 });
  world.beta = 0.2;
  world.taxRate = 0.03;
  world.tradesPerRound = protocol.tradesPerRound;
  world.levyEveryRounds = protocol.levyEveryRounds;
  const recorder = new OutcomeRunRecorder({ protocol, beta: world.beta, taxRate: world.taxRate, seed });
  const outcomes: RecordedOutcome[] = [];
  world.onMeasurement((measurement) => {
    const result = recorder.observe(measurement, world);
    if (result) outcomes.push(result);
  });
  for (const chunk of chunks) world.step(chunk);
  return outcomes;
}

describe('OutcomeRunRecorder', () => {
  it('turns one seed into exactly one aggregate even if the room keeps running', () => {
    const outcomes = record(17, [75, 125, 300]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].seed).toBe(17);
  });

  it('is deterministic and invariant to UI batch size', () => {
    expect(record(17, [200])).toEqual(record(17, [7, 13, 31, 149]));
  });

  it('matches the headless protocol outcome at identical checkpoints', () => {
    const recorded = record()[0].outcome;
    const headless = runOutcome({ ...protocol, beta: 0.2, taxRate: 0.03, seed: 17 });
    for (const metric of Object.keys(headless) as (keyof typeof headless)[]) {
      expect(recorded[metric]).toBeCloseTo(headless[metric], 12);
    }
  });

  it('invalidates a room when policy or cadence changes mid-run', () => {
    const world = new SandboxWorld({ n: protocol.n, seed: 17, startDollars: 100 });
    world.beta = 0.2;
    world.taxRate = 0.03;
    world.tradesPerRound = protocol.tradesPerRound;
    world.levyEveryRounds = protocol.levyEveryRounds;
    const recorder = new OutcomeRunRecorder({ protocol, beta: world.beta, taxRate: world.taxRate, seed: 17 });
    const outcomes: RecordedOutcome[] = [];
    world.onMeasurement((measurement) => {
      const result = recorder.observe(measurement, world);
      if (result) outcomes.push(result);
    });
    world.step(50);
    world.levyEveryRounds = 1;
    world.step(150);
    expect(outcomes).toEqual([]);
  });

  it('accepts zero-tax finite-horizon outcomes without calling them stationary', () => {
    const world = new SandboxWorld({ n: protocol.n, seed: 9, startDollars: 100 });
    world.beta = 0.2;
    world.taxRate = 0;
    world.tradesPerRound = protocol.tradesPerRound;
    world.levyEveryRounds = protocol.levyEveryRounds;
    const recorder = new OutcomeRunRecorder({ protocol, beta: world.beta, taxRate: 0, seed: 9 });
    const outcomes: RecordedOutcome[] = [];
    world.onMeasurement((measurement) => {
      const result = recorder.observe(measurement, world);
      if (result) outcomes.push(result);
    });
    world.step(protocol.trades);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].outcome.levyFlow).toBe(0);
  });
});

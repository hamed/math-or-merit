import {
  connectedRandomGraph,
  quantile,
  ringGraph,
  runAdditiveStudy,
  runBaselineEnsemble,
  runFlatBudgetStudy,
  runManualRichestBudgetStudy,
  runNetworkStudy,
  runProgressiveBudgetStudy,
  runWeightedAccessStudy,
  torusGraph,
  type InterventionCheckpoint,
  type NetworkStudyCheckpoint,
  type StudyCheckpoint,
  type WeightedAccessStudyCheckpoint,
} from '../src/lib/research';

const seeds = Array.from({ length: 30 }, (_, seed) => seed);
const summarize = (values: readonly number[]) => ({
  q05: quantile(values, 0.05),
  median: quantile(values, 0.5),
  q95: quantile(values, 0.95),
});
const endpoint = (runs: readonly (readonly StudyCheckpoint[])[]) => {
  const last = runs.map((run) => run.at(-1)!);
  return {
    gini: summarize(last.map(({ gini }) => gini)),
    topShare: summarize(last.map(({ topShare }) => topShare)),
    effectiveParticipants: summarize(last.map(({ effectiveParticipants }) => effectiveParticipants)),
  };
};
const topologyEndpoint = (runs: readonly (readonly NetworkStudyCheckpoint[])[]) => {
  const last = runs.map((run) => run.at(-1)!);
  return {
    ...endpoint(runs),
    localRichAgents: summarize(last.map(({ localRichAgents }) => localRichAgents)),
    neighborWealthCorrelation: summarize(last.map(({ neighborWealthCorrelation }) => neighborWealthCorrelation)),
    effectiveEncounterEdges: summarize(last.map(({ effectiveEncounterEdges }) => effectiveEncounterEdges)),
  };
};
const accessEndpoint = (runs: readonly (readonly WeightedAccessStudyCheckpoint[])[]) => {
  const last = runs.map((run) => run.at(-1)!);
  return {
    ...endpoint(runs),
    encounterWealthCorrelation: summarize(last.map(({ encounterWealthCorrelation }) => encounterWealthCorrelation)),
    effectiveEncounteredAgents: summarize(last.map(({ effectiveEncounteredAgents }) => effectiveEncounteredAgents)),
  };
};
const interventionEndpoint = (runs: readonly (readonly InterventionCheckpoint[])[]) => {
  const last = runs.map((run) => run.at(-1)!);
  return {
    ...endpoint(runs),
    cumulativeRevenue: summarize(last.map(({ cumulativeRevenue }) => cumulativeRevenue)),
  };
};

const checkpoints = [0, 1_000, 10_000, 100_000] as const;
const baseline = [0.1, 0.25, 0.5].map((beta) => ({
  beta,
  checkpoints: runBaselineEnsemble({ n: 100, beta, checkpoints }, seeds).summary,
}));

const topologySteps = [0, 10_000, 100_000] as const;
const topology = {
  ring: topologyEndpoint(seeds.map((seed) => runNetworkStudy({ n: 100, beta: 0.25, seed, edges: ringGraph(100) }, topologySteps))),
  torus: topologyEndpoint(seeds.map((seed) => runNetworkStudy({ n: 100, beta: 0.25, seed, edges: torusGraph(10, 10) }, topologySteps))),
  connectedRandom: topologyEndpoint(seeds.map((seed) => runNetworkStudy({
    n: 100,
    beta: 0.25,
    seed,
    edges: connectedRandomGraph(100, 0.03, seed + 10_000),
  }, topologySteps))),
};

const weightedAccess = [0, 0.5, 1].map((accessExponent) => ({
  accessExponent,
  endpoint: accessEndpoint(seeds.slice(0, 10).map((seed) => runWeightedAccessStudy({
    n: 30,
    beta: 0.25,
    seed,
    accessExponent,
  }, [0, 1_000, 10_000]))),
}));

const additive = endpoint(seeds.map((seed) => runAdditiveStudy(100, seed, topologySteps)));

const interventionConfig = { n: 100, beta: 0.25, cycles: 100, tradesPerCycle: 1_000 } as const;
const budgetPerCycle = 0.002;
const manualRuns = seeds.map((seed) => runManualRichestBudgetStudy({ ...interventionConfig, seed }, budgetPerCycle));
const flatRuns = seeds.map((seed) => runFlatBudgetStudy({ ...interventionConfig, seed }, budgetPerCycle, 0.005));
const progressiveRuns = seeds.map((seed) => runProgressiveBudgetStudy({ ...interventionConfig, seed }, budgetPerCycle, [
  { above: 0, rate: 0.01 },
  { above: 0.01, rate: 0.05 },
  { above: 0.05, rate: 0.2 },
]));
const interventions = {
  budgetPerCycle,
  developmentSeeds: seeds.slice(0, 20),
  heldOutSeeds: seeds.slice(20),
  manualRichest: {
    all: interventionEndpoint(manualRuns),
    heldOut: interventionEndpoint(manualRuns.slice(20)),
  },
  flat: {
    all: interventionEndpoint(flatRuns),
    heldOut: interventionEndpoint(flatRuns.slice(20)),
  },
  progressive: {
    all: interventionEndpoint(progressiveRuns),
    heldOut: interventionEndpoint(progressiveRuns.slice(20)),
  },
};

console.log(JSON.stringify({
  protocolVersion: 1,
  seeds,
  baseline,
  topology,
  weightedAccess,
  additive,
  interventions,
}, null, 2));

# 012 - Optional seeded simulation replay

## Status
Accepted

## Context
The essay may show one vivid run, but scientific claims require reproducible ensembles.
The initial TypeScript engine used `Math.random`, so neither a run nor a failed test could
be replayed. Metrics and experiment records do not belong in the production state shape.

## Decision
`SimConfig` accepts an optional unsigned 32-bit `seed`. A seeded engine owns a local
pseudorandom sequence, and `reset()` rewinds that sequence as well as restoring equal
wealth and step zero. Omitting the seed preserves non-deterministic interactive use.

Research runs must always provide a seed. Batch metrics, checkpoints, uncertainty
summaries, and experiment-specific observations stay in a headless research layer rather
than expanding `SimState`.

## Consequences
- Seeded runs and tests can be replayed exactly.
- Interactive callers do not need to manage randomness.
- The future WASM engine must reproduce the documented seeded behavior before it can
  replace the TypeScript engine for research runs.
- Encounter strategies, economic event streams, and interventions remain separate
  decisions. Seeded randomness does not create a generic experiment interface.

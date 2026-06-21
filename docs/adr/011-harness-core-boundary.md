# 011 - Sandbox, mini-games, and simulation boundary

## Status
Deferred

This record is not an active architecture constraint. The point-and-shoot tax game,
progressive-tax designer, other mini-games, and competing boundary ideas live in
[`notes/ideas.md`](../../notes/ideas.md).

## Context
The project may contain several experiences around the same economic process:

- a sandbox with broad controls and no required goal;
- a point-and-shoot game where the player clicks an individual to tax them;
- a separate game for designing progressive brackets or more complex tax rules;
- other constrained roles and policy experiments.

Scores, goals, and player instructions are presentation or harness concerns. However, the
simulation capabilities these games actually need are not yet known. The earlier proposal
of "parameters in, event stream out, generic interventions in" prematurely fixed an
interface and included operations such as spawn and remove that may conflict with fixed
typed-array state.

## Candidate direction
Reuse the same economic implementation where the rules truly match, while keeping each
mini-game's goals, scoring, instructions, and input behavior outside the simulation core.

Do not yet standardize an event stream or universal intervention channel. Let the first
mini-game expose the smallest domain operation it needs, then compare requirements when a
second mini-game is implemented.

The two tax games remain distinct:

- clicking a person is reactive, embodied, and individually targeted;
- designing tax brackets is structural, automatic, and policy-oriented.

Whether either game can "win," and under which constraints, is an experimental and design
question rather than a result to encode in the core.

## Open questions
- What exactly is taxed: wealth, transaction gain, or an income-like quantity?
- Where does collected value go?
- Which operations belong to the economic model versus a harness?
- Are events required, or are state snapshots sufficient?
- Does any experiment need population resizing?
- Which metrics define a game objective without pretending to forecast a real economy?
- What common contract appears only after two working mini-games exist?

## Revisit when
The first mini-game is specified closely enough to implement its actions and measurements.

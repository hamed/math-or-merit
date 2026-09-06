# Levies and intervention games

## Model vocabulary

The current state contains wealth, not income. These experiments therefore apply wealth
levies followed by immediate equal dividends. "Income tax" and forecasts about real tax
codes are out of scope.

## Implemented exploratory protocols

- **Manual upper bound:** every 1,000 trades, perfectly observe and levy the current
  richest agent.
- **Flat structural levy:** periodically levy wealth above an exemption.
- **Progressive structural levy:** periodically apply marginal rates above wealth
  thresholds.

All three conserve total wealth, use the same per-cycle collection budget, and record
cumulative revenue, Gini, top share, wealth floor, and effective participant count. The
manual protocol is automated perfect targeting, not a measurement of human reaction time.

## Evidence gate

Protocol version 1 matches cumulative collection at `0.2` of normalized wealth and
reports seeds `20..29` separately from development seeds. The endpoint distributions
overlap substantially; it does not establish that one incidence rule dominates. A
confirmatory game study must still:

1. vary the redistribution budget explicitly;
2. predeclare observation delay, human action rate, targeting information, and win metric;
3. evaluate multiple `N`, `beta`, and assessment intervals;
4. report cases where manual control succeeds as readily as failures;
5. describe only this toy exchange process.

## Literature reconciliation

- [Boghosian (2014)](https://arxiv.org/abs/1407.6851) derives a continuous
  Fokker-Planck description with redistribution. Its rate term is not automatically
  equivalent to the current periodic discrete levy.
- [Lima, Vieira, and Anteneodo (2022)](https://arxiv.org/abs/2007.11680) study nonlinear
  redistributive wealth taxes in Yard-Sale dynamics. Their piecewise-linear rule exempts
  wealth below a threshold and taxes excess wealth; their power-law family spans
  regressive, proportional, and progressive cases. This is the closest current lead for
  the planned curve editor, but the exact update timing and normalization must be matched
  before importing a result.
- [Bustos-Guajardo and Moukarzel (2016)](https://doi.org/10.1142/S0129183116500947)
  show that proportional-tax Yard-Sale tails are asymptotically Gaussian, with only a
  restricted-range power-law-like regime under weak taxation. Taxation does not license
  a generic Pareto-tail claim.
- The phase transition in
  [Boghosian et al. (2017)](https://arxiv.org/abs/1511.00770) is organized by
  redistribution competing with **wealth-attained advantage**, a bias in the coin flip.
  It is not evidence that stake and tax alone define a theoretical phase transition in
  the current fair-coin model.
  Review check, 2026-06-23: the arXiv record for `1511.00770` is the intended paper,
  titled "Oligarchy as a Phase Transition: The effect of wealth-attained advantage in a
  Fokker-Planck description of asset exchange." The record lists a 2015 submission and
  2016 revision, so use the title/arXiv ID when the publication-year citation could
  confuse provenance.

The literature supports studying redistribution inside an explicit Yard-Sale variant.
It does not support forecasts about real tax policy, nor the current rhetorical ordering
of manual and structural controls without the confirmatory game protocol above.

## Verdict

**Defer.** The matched-budget runner is ready and its current result is ambiguous. No
"structural beats manual" lesson passes without realistic action constraints and a
broader confirmatory grid.

## Superseded phase-map stability memo (2026-07-06, M8 build)

Beat 23 shipped as a **measured map plus a fitted curve**, per the GATE:

- Grid: β ∈ {0.05…0.50, step 0.05} × flat levy τ ∈ {0…0.12, step 0.01} per round
  (levy every N trades), N = 100, 200k trades, burn-in 120k, tail-mean Gini of 8
  checkpoints, two seeds averaged in the shipped widget
  (`src/lib/widgets/phase/PhaseDiagram.svelte`, compute in `src/lib/research/phase.ts`).
- The white contour is the **measured** Gini = 0.5 frontier (marching squares).
- The dashed curve is a **least-squares fit** of τ*(β) = c·β² through the measured
  column crossings. Scaling motivation only (per-trade variance ∝ β²); no theorem claimed,
  and the Boghosian caveat above still applies — their transition involves biased coins,
  not this fair-coin model.
- Stability (`scripts/phase-stability.ts`): c across seeds {11, 271, 977} and
  N ∈ {50, 100, 200} stays in **0.344–0.379** (N = 100: 0.370–0.379). The map and the
  frontier are reproducible; the widget displays whatever c its own live grid fits.
- Language guard: captions say "measured" for the contour and "fitted" for the curve;
  "theoretical", "law", and "phase transition" stay out of the essay.
- Beat 20 now uses LevyLesson to show the structural levy alone, coin by coin and
  then repeated to visual equality (β = 0, geometric equalization — exact: one flat
  levy scales every deviation by 1 − rate). The manual-vs-structural comparison
  remains **unclaimed** (Verdict above still Defer).

This memo records the old implementation; it is no longer the narrative contract. The
Gini `0.5` contour was a chosen finite-run level, not evidence for two regimes or a phase
transition. Protocol version 2 replaces correlated or two-seed cells with independent
multi-metric outcomes and makes effective participants the primary continuous field.

The square family remains worth measuring because redistribution is naturally compared
with transaction variance `beta²`. Any fitted curve must name its selected outcome,
cadence, horizon, parameter range, and replicate count. It must never be called a
critical frontier or universal policy rule.

## Effective-participation map convergence check (2026-09-04)

The guided protocol-v2 map uses `N = 100`, 200,000 trades, burn-in at 120,000,
eight tail checkpoints, one levy per 100-trade measurement round, stakes `0.05…0.50`,
levies `0…0.14`, and the explicitly chosen outcome of 50 effective participants.
Deterministic research ensembles of four and eight nested seeds were compared before
choosing the guided map's minimum count.

- Median absolute change in cell means from four to eight runs: `0.141` effective
  participants (acceptance limit: `2`).
- Fitted coefficient: `0.4026` at four runs and `0.3992` at eight runs, a `0.835%`
  relative change (acceptance limit: `5%`).
- All ten stake columns crossed the selected outcome in both ensembles.

Four independent runs per cell therefore passes the predeclared convergence gate for
this finite protocol and parameter range. Reader runs remain fresh and join the same
cell aggregate; completing the map tops under-sampled cells up to at least four runs.
The contour remains a selected challenge and the fit remains descriptive, not a phase
boundary, stationary claim, or policy prescription. The exact reproducible calculation
lives in `scripts/participation-map-convergence.ts`.

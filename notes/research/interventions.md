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

The literature supports studying redistribution inside an explicit Yard-Sale variant.
It does not support forecasts about real tax policy, nor the current rhetorical ordering
of manual and structural controls without the confirmatory game protocol above.

## Verdict

**Defer.** The matched-budget runner is ready and its current result is ambiguous. No
"structural beats manual" lesson passes without realistic action constraints and a
broader confirmatory grid.

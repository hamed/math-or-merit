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

The literature lead is the redistributed Yard-Sale Fokker-Planck model in
[Boghosian (2014)](https://arxiv.org/abs/1407.6851); its mechanism must not be assumed
identical to these discrete levies without reconciliation.

## Verdict

**Defer.** The matched-budget runner is ready and its current result is ambiguous. No
"structural beats manual" lesson passes without realistic action constraints and a
broader confirmatory grid.

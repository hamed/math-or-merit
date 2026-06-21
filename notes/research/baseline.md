# Baseline Yard-Sale model

## Exact rule

For selected distinct agents `i` and `j`, let `s = beta * min(w_i, w_j)`. A fair,
independent coin decides between `(w_i + s, w_j - s)` and `(w_i - s, w_j + s)`.
Pairs are uniformly mixed and everyone begins with wealth `1 / N`.

This matches the fixed-fraction finite model in
[Börgers and Greengard](https://arxiv.org/abs/2308.01485) for `0 < beta < 1`.

## What is established

- Total wealth is conserved exactly in the mathematical update.
- Non-negative wealth remains non-negative for `0 <= beta <= 1`.
- Each selected agent's conditional expected monetary change is zero.
- For finite `N` and `0 < beta < 1`, the wealth vector converges almost surely to a
  canonical basis vector: one limiting owner.

## Boundaries

- `beta = 0` is static and excluded from the condensation theorem.
- `beta = 1` can create exact zeros in one trade and is outside the cited theorem's open
  interval; do not silently generalize the proof.
- Almost-sure convergence is not a promised finite completion time.
- Floating-point runs use thresholds and can underflow before mathematical convergence.
- A fair monetary expectation does not imply equal risk experience or real-world justice.
- A realized Gini can fall on a poorer-agent win. Never say it rises every trade.

## Experiment

The headless runner records seeded checkpoint ensembles without adding metrics to
`SimState`. Protocol-v1 results reproduce increasing concentration and strong
`beta`-dependent timing; they do not estimate an asymptotic rate law.

## Verdict

**Include.** This is the load-bearing essay result. Use the exact rule, conditional
meaning of fairness, asymptotic qualifier, and multiple runs.

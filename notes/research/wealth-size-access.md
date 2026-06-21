# Wealth, visible size, and access

## Causal controls

1. Fixed visual and encounter size: baseline.
2. Wealth changes visual size only: economically identical to the same seeded baseline.
3. Wealth changes encounter access only: weighted-access research model.
4. Wealth changes both: same economy as control 3, different presentation.

Controls 2 and 4 cannot be distinguished in a headless economic result; that is the
point. Rendering alone must not change the trajectory.

## Geometry

- Radius proportional to wealth: `r proportional to w`.
- Area proportional to wealth in 2D: `r proportional to sqrt(w)`.
- A two-disk collision cross-section depends on both radii, so neither mapping by itself
  defines a collision process.

Protocol version 1 therefore tests an abstract access kernel
`(wealth + offset)^alpha`, with `alpha = 0, 0.5, 1`. It does **not** call those cases
physical radius, area, or collision cross-section.

## Current evidence

The weighted sampler produces much faster finite-time concentration for positive
exponents in the small protocol-v1 ensemble. This is a result about that sampler only.
The wealth offset, endogenous selection, finite precision, and small `N` all matter.

Encounter counts, effective encountered agents, and encounter/wealth correlation are
recorded. Conditional change and volatility by wealth bin need a preregistered follow-up.
A moving-disk model should be built only if it answers a question the weighted sampler
cannot.

## Language gate

Do not use "preferential attachment," "scale free," "Bose-Einstein," or a phase label
unless the transition kernel is derived and matched. "More access" is not positive
expected gain per selected fair trade.

## Verdict

**Defer.** Keep the control and preliminary result; do not promote a causal or physical
claim yet.

# 009 - Wealth, visible size, and collision size

## Status
Deferred

This record is not an active architecture constraint. The original intuition, analogies,
counterarguments, and experimental controls live in
[`notes/ideas.md`](../../notes/ideas.md).

## Context
One hypothesis makes wealthier agents visually larger and possibly gives them a larger
collision radius. If collision size affects encounter frequency, the economy feeds back
into the encounter mechanism.

The result is unknown. More trades do not automatically create positive expected wealth
change under a fair exchange rule. The mechanism may affect exposure, variance, spatial
patterns, or concentration time. Comparisons to preferential attachment and known phase
classes are research leads, not established properties of this model.

## Candidate direction
If this experiment is built, separate at least these cases:

1. wealth affects neither visible size nor collision size;
2. wealth affects visible size only;
3. wealth affects both visible size and collision size.

Keep the causal coupling explicit and switchable. State whether wealth controls radius,
area, or collision cross-section; these mappings are not equivalent.

Uniform pairing remains the clean baseline for the fair-process argument, but that is an
essay and experiment preference rather than a permanent engine restriction.

## Open questions
- Does wealth-dependent collision size change expected gain or only activity and variance?
- Which geometric mapping is meaningful in 2D?
- Does the mechanism accelerate, delay, or qualitatively change concentration?
- Is preferential attachment a valid mathematical comparison or only an intuition?
- Which metrics and controls can isolate the feedback?
- Should visible size ever be allowed to alter physics implicitly?

## Revisit when
A spatial collision experiment exists and visual size is being considered as a causal
input rather than only an encoding.

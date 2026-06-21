# 008 - Pluggable encounter mechanisms

## Status
Deferred

This record is not an active architecture constraint. Candidate experiments and raw
predictions are retained in [`notes/ideas.md`](../../notes/ideas.md).

## Context
Possible experiments include uniform random matching, fixed networks, local 2D
neighborhoods, and moving bodies that transact on collision. A physical-particle scene
may also help explain the pairwise structure of kinetic wealth models.

The effects of topology are not yet known. Restricted encounters may produce local
concentration, persistent regions, one global winner, or other behavior depending on
connectivity and motion. The physical comparison may be an analogy, a shared equation,
or two related models; that must be established rather than assumed.

## Candidate direction
Make encounter selection replaceable without rewriting the baseline Yard-Sale exchange.
Start with uniform random matching and introduce another mechanism only for a concrete
experiment.

Spatial mechanisms may require position, velocity, time advancement, collision handling,
or neighborhood state. Those needs could exceed a narrow "select one pair" contract, so
the contract should emerge from an implementation rather than be fixed here.

Any additional per-agent numeric fields should remain compatible with ADR 003's
struct-of-arrays decision.

## Open questions
- What connectivity or mixing assumptions produce local or global concentration?
- Do agents move, remain fixed, or rewire their connections?
- Does an encounter mechanism return pairs, events, or an advanced world state?
- Can uniform and spatial runs share one stepping model?
- What part of the particle comparison is scientifically defensible?
- Which measurements distinguish topology effects from transaction effects?

## Revisit when
The first non-uniform encounter experiment has a written rule and measurable question.

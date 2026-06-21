# 007 — Game / society / individual split

## Status
Proposed

## Context
The whole argument is that a *fair local rule* produces extreme concentration regardless of how agents meet. Making that argument requires holding the exchange rule fixed while swapping the matching topology underneath it — and watching condensation appear either way. If the rule and the topology fuse into one "economics" blob, that swap is impossible and the universality claim collapses into "just a model."

## Decision
Cut the simulation into three concerns that never bleed into each other:

- **Game** — the two-body rule (Yard-Sale exchange, stake, tax). Takes a pair, returns updated wealth. Knows nothing about *how* the pair met or *where* they are.
- **Society** — the matching topology. Decides *who meets whom*, never *what happens*. See ADR 008.
- **Individual** — the display. Reacts to what the game did and otherwise lives its own small life; pure output, never feeds back. See ADR 010.

The load-bearing guard: **the game must never know its topology.** No branch in the two-body rule on whether pairing is spatial or mean-field.

## Consequences
- "Swap the substrate, hold the rule fixed" becomes a first-class operation — the move the entire thesis rests on (universality in the statistical-physics sense).
- This is the project's "no special-case in the generic waist" law (ADR 001, ADR 005) applied one level in, inside the sim core that sits behind ADR 002's interface.
- Cost: two internal contracts must be honoured — society hands the game a *pair* and nothing more; the game hands the individual *per-agent outcomes* and nothing flows back up. Breaking either reopens the one-way door.

# 008 — Pluggable society behind a pair-selection contract

## Status
Proposed

## Context
ADR 007 separates the matching topology (society) from the rule (game). That cut only pays off if different topologies plug into the *same* kernel. There is also a physics point to make: the Yard-Sale exchange is literally a kinetic-collision rule, so a "gas" substrate is not an analogy but the system the econophysics was abstracted from.

## Decision
The society is a slot with one contract: **it selects pairs.** Substrates plug in behind it with the game unchanged:

- **Mean-field** — uniform random pairing; clean, condenses globally and fast.
- **Spatial 2D** — transact on collision; spatial correlation, domains before a global winner.
- **Physical gas** — kinetic collisions redistributing a conserved quantity (additive → equilibrate, multiplicative → condense).

Frame the result honestly as **"inevitable by different roads,"** not "identical everywhere": the rule guarantees condensation, the society shapes its route.

## Consequences
- New substrates are added without touching the game — the universality demonstration is built in, not asserted.
- Spatial/gas substrates add per-agent state (position, velocity). This **extends** ADR 003's struct-of-arrays layout to more fields; it does not change the decision.
- Cost: the society contract must stay "a pair, nothing more." The moment the game reads topology, ADR 007's guard is broken.

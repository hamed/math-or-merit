# 009 — Wealth→size→collision-rate: one quarantined coupling

## Status
Proposed

## Context
A second condensation mechanism can stack on the exchange rule: if size scales with wealth and collision probability scales with size, the rich get *more trades*, not just better ones — preferential attachment in the Barabási sense. This is powerful pedagogy and a containment hazard: it is the one place economics feeds back into the society, closing an otherwise strictly feed-forward system.

## Decision
Allow exactly one feedback path — **wealth → size → collision-rate** — through a single explicit coupling point that must never leak into the spatial substrate's internals.

- Keep **uniform pairing as the load-bearing default.** Size-bias is an *additional twist*, never the headline; leading with it invites the "you built in rich-get-richer" dismissal.
- Treat the **size↔wealth geometric mapping as a phase-selecting parameter**, not a cosmetic constant: sublinear → no hub, ~linear → scale-free tail (Barabási–Albert class), superlinear → winner-take-all. Expose it deliberately.

## Consequences
- The reader can toggle attachment on/off and *cross the condensation transition* by hand — the title "Math or Merit?" becomes a knob.
- The single backflow stays auditable because it lives at one coupling, consistent with the containment discipline of ADR 007.
- The size field rides ADR 003's struct-of-arrays layout. Cost: the mapping's exponent is a real, regime-selecting parameter, so it must be surfaced and documented, not buried as a constant.

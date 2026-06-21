# 011 — Harness / core boundary

## Status
Proposed

## Context
The finished piece is a sandbox plus mini-games. If the simulation core learns that it is being graded — win conditions, scores, "the player" — mini-game logic welds into the core and the sandbox inherits dead code. This is the ADR 001 / ADR 005 leak smell at a new floor.

## Decision
The core exposes three things and only these: **parameters in, a stream of events out, and a generic "apply an external intervention to agent(s)" channel** (tax / inject / spawn / remove). **Scores, win conditions, and the very notion of "the player" live in the harness, never in the core.**

Sandbox and mini-game are the *same core in different harnesses*: the sandbox binds the intervention channel to free tools with no goal; a mini-game locks most parameters and binds the channel to one scored weapon.

## Consequences
- New mini-games are mostly UI over an unchanged core — e.g. the flagship tax-agent game, tuned so point-and-shoot genuinely *cannot* win, teaching by failure that a structural problem needs a structural lever.
- This is ADR 001's engine/content split realised for interactivity: the harness is mounted as content via ADR 005 and consumes the core via ADR 002's interface.
- Cost: the intervention channel must stay generic — no per-mini-game branch inside the core, ever.

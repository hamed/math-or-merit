# 001 — Engine/content split

## Status
Accepted

## Context
The piece grows by accumulating content — sections, notes, mini-games, later audio and translations — with no known upper bound. If the engine grows every time a unit of content is added, complexity scales with instances and the project collapses under its own scatter.

## Decision
One engine. Text, notes, widgets, and audio are *data* that flows through it, not code that extends it. The engine tracks the number of *kinds* of things, not the number of *instances*. (Doom/WAD model: a fixed engine, an unbounded content pile.)

## Consequences
- Content can sprawl indefinitely without touching engine code.
- The piece is shippable at every size — stop adding units whenever; there is no half-built scaffold to abandon, only a working engine and a content pile of whatever length.
- The cost is discipline at one boundary: the engine must never learn the identity of a specific content unit or widget. See ADR 005.

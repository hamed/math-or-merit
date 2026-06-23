# 005 — Uniform widget contract

## Status
Accepted

## Context
Mini-games and interactive widgets are where the piece grows most and varies most. If the engine knows about specific widgets, every new widget edits the engine — and the engine's waist is the one irreversible asset we must protect. This is the project's single failure mode: `if (widgetType === 'thisOne')` in `WidgetSlot` or the engine.

## Decision
Every widget is a deep module behind a small, uniform interface: mount / config / events / cleanup. `WidgetSlot` mounts by contract and knows no specific widget. The engine knows the contract, never an identity. Internal complexity (state machines, branching, statecharts) lives *inside* the widget, behind the interface.

## Consequences
- Open/Closed: new widgets are added without touching the engine.
- Nonlinearity has a licensed home — widgets may loop and branch internally as much as needed, because that complexity is firewalled behind the contract.
- The guard is absolute: no special-casing a widget type in the slot or engine, ever. A special case feels fast and reversible but silently spends the engine's simplicity, which is not reversible. This boundary is the one to defend; the rest of the codebase may be as scattered as desired.

## Amendment (2026-06-23) — the guard extends to any stage/timeline sequencer

The stage-aware stance under exploration (ADR 004 amendment; `notes/draft-decisions.md` D8) may introduce a timeline/sequencer that assigns occupants to fixed locations per beat. That sequencer is a **new surface** where this ADR's single failure mode can reappear: it must map beat → state by *data* and must never special-case a beat or stage by identity (`if (beat === 'cow')`). The guard is not limited to `WidgetSlot` and the engine — it binds any content-agnostic dispatcher we add, including a stage timeline. No new interface is decided here; only that the guard travels with the mechanism if it is built.

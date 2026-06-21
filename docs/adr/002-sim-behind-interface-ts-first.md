# 002 — Sim core behind a single interface, TS first

## Status
Accepted

## Context
The simulation is the long-lived, valuable core; the UI is a disposable skin. We may later want a Rust/WASM implementation for large N, but we don't want to pay for it now, and we don't want the choice between TS and Rust to be a one-way door.

## Decision
Define a single `SimEngine` interface as the boundary. `TsEngine` implements it now. A `WasmEngine` can drop in later, unchanged from the consumer's side. Dependencies point inward: Svelte imports the sim, never the reverse. The sim is headless, framework-agnostic, and unit-testable in milliseconds.

## Consequences
- "TS or Rust" becomes a two-way door — swap the implementation behind the interface without touching the UI.
- The sim can be tested without a browser or framework, so the feedback loop stays in milliseconds.
- A factory (`createEngine`) selects the implementation, keeping call sites ignorant of which engine they got.
- Constraint: anything that can't cross a WASM boundary cheaply must not leak into the interface. See ADR 003.

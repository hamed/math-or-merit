# 003 — State as `Float64Array` (struct-of-arrays)

## Status
Accepted

## Context
Wealth across N agents is the hot state. It is stepped many times per frame and, eventually, must cross a WASM boundary cheaply. An array of agent objects would be slow in JS, foreign to Rust, and expensive to marshal.

## Decision
Represent state as typed arrays in struct-of-arrays layout — wealth is a `Float64Array`, not an array of `{wealth}` objects. This is simultaneously the fastest layout in JS, the natural Rust memory layout, the only thing that crosses the WASM boundary cheaply, and how a physicist writes it on paper. Cut this now, before the Rust impl exists, so that impl is a drop-in.

## Consequences
- The TS and future Rust engines share a memory model, making ADR 002's swap real rather than aspirational.
- Per-frame stepping is allocation-free and cache-friendly.
- Cost: code reads index-oriented (`wealth[i]`) rather than object-oriented (`agent.wealth`). Accepted — the boundary's shape is a human-owned, irreversible decision and worth the ergonomic tax.

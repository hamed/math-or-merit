# ADR 014 — The sandbox is the reusable machine; the phase map is reader-measured

Date: 2026-07-16 · Status: accepted (owner reviews 00–03, commits R9–R11e)

## Decision

1. **One machine, presets over variants.** `Sandbox.svelte` is the essay's
   single full-dial machine. Earlier beats become *presets* of it via
   configuration data — `layout` (`full` / `column`), `panels`, `controls` —
   never via new branches inside the component or the engine. This extends
   ADR-001's engine/content split to the finale widget itself.

2. **One plot chrome.** Every sandbox chart is a `PlotFrame` citizen sharing
   geometry, fonts, and the interaction conventions: axis click toggles
   log↔linear (zeros are dropped from log axes), body click cycles
   (bins / time views / map styles), double-click zooms, Escape closes,
   hover reveals fitted insights. Round-number ticks only (`ticks.ts`);
   the unit lives in the axis label.

3. **The phase record is measured by the reader, per room size.**
   Nothing is precomputed. The ticker solidifies steady-state Gini tail
   averages (50-round windows, two consecutive within 0.015) into
   `phaseGrid.svelte.ts`, keyed by the exact dial stops *and* by `n` —
   the settled Gini is a finite-size quantity; mixing room sizes would lie.
   Persistence is localStorage with CSV export/import (merge-averaged); no
   server. Theory appears only where a closed form exists (tax=0 → Gini→1,
   stake=0 → stays equal), always dashed and labeled "theory".

4. **The toy world is deliberately unclamped; the research layer is not.**
   `SandboxWorld` accepts any rate or stake (expert mode's negative taxes and
   250% stakes are part of the curriculum) and carries its own tolerant
   metrics (`measureToy`); `src/lib/research/` keeps strict validation. A
   watchdog converts non-finite wealth into a visible "THE ECONOMY BROKE"
   state instead of a dead canvas.

## Consequences

- Content growth = new presets + prose, not engine growth (core law upheld).
- Display experiments (colormaps, map styles) are data/UI-local; simulation
  values stay simulated — interpolation and smoothing are display-only.
- The measured record is honest but sparse by design; empty plots carry
  invitations ("every settled run paints its point"), not spinners.

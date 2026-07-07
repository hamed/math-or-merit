# ADR 013 — PinScene stage engine: GSAP scrub for authored beats, yield for play

**Status:** Accepted, 2026-07-06 (implements the D8 "two-stream" stance; resolves the
ADR-004/005 amendments' open seam; supersedes the StageChapter/SceneMark/MorphStage
prototype, now deleted).

## Decision

The essay's presentation has exactly two section kinds:

1. **Scrub scenes** — authored, deterministic beats (opening teletype, belief cloud,
   cow joke, person→coins, trade rule, closing). Each is a `PinScene` that pins the
   viewport and scrubs one GSAP timeline with scroll; scrolling back plays it in
   reverse by construction. Captions are tweened *inside* the master timeline (Svelte
   transitions are time-based and would fight the scrub clock).
2. **Yield sections** — interactive widgets on the reader's clock (prediction, runs,
   games, phase map, sandbox). Full-viewport, unpinned, in normal flow. Stochastic
   runs **re-run; they are never scrubbed**. That is the two-clocks rule.

GSAP (core + ScrollTrigger + MorphSVG; 100% free since April 2025) is the project's
first runtime dependency. It is **quarantined**: `src/lib/widgets/stage/gsap.ts` is
the only file that imports `gsap`; `src/lib/sim/` and `src/lib/research/` can never
touch it. `src/lib/boundaries.test.ts` enforces both facts as a test.

## The contract (no beat branching)

`stage/contract.ts`: a scene is a deep module that calls
`attach(BEATS, build(tl))` once — `BEATS` is a data table (`{label, length}`), and
`build` fills the timeline against those labels. `PinScene` knows no scene by name;
`Caption` children register by beat index. The ADR-005 guard extends here verbatim:
**no `if (beat === 'cow')` in the sequencer, ever** — beat→state mapping lives in each
scene's own data.

## Grain and translation (ADR-004 resolved)

A beat is a unit of **presentation**, not authoring. Captions remain inline children
in `essay.en.svx`, so the document is still the manifest and the future `essay.fa.svx`
translates captions in place. Scene visuals (SVG, paths, choreography) live in
`$lib/widgets/stage/scenes/`, language-free.

## Fallbacks

- **Reduced motion:** `PinScene` creates no pin and no scrub; the visual is sticky,
  captions flow in-document, and an IntersectionObserver seeks the same timeline to
  each beat's settled pose. One timeline, two drivers — scenes carry no second code path.
- **No JS:** captions are real text in reading order; every scene's static markup is
  its legible initial pose; the teletype headline text exists in the DOM.

## Amendment to ADR-011

The full sandbox ships as the essay's final yield section rather than a separate
page/mode. Same engine, same harness discipline (`SandboxWorld` composes primitives;
`SimConfig`/`SimState` untouched) — only the placement changed.

## Consequences

- Reverse-on-scroll is free and exact for authored beats; it is structurally
  impossible for stochastic ones, which is the honest split.
- GSAP lifecycle rules live in one file: build inside `gsap.context()` in `onMount`,
  cleanup with `ctx.revert()`, `ScrollTrigger.refresh()` on `document.fonts.ready`,
  `anticipatePin`, no transforms above pinned elements.
- Cost: ~60 kB gzip of presentation dependency, quarantined and droppable — the
  `attach` contract is the seam a hand-rolled driver would re-implement behind.

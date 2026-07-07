# CONTEXT.md — session handoff for agents

Read `AGENTS.md` first (architecture law). This file is the *state* snapshot: what
is built, what was decided, how to verify, what remains. Written 2026-07-06 after
the scrollytelling rebuild shipped.

## Where things stand

Branch `claude/interactive-build`, milestones M0–M10 committed (git log from
`20ed4c8` "M0: GSAP quarantine…" to `67770c1` "M10: ADR-013…"). ~100 vitest tests
green, `npm run build` clean, headless QA sweeps (desktop / mobile 390px /
reduced-motion, forward AND reverse scroll) show zero console errors.

The essay is now a scroll-driven explorable per Hamed's hand-drawn storyboard —
transcribed durably in `notes/storyboard.md` (the inbox PDF and review.md were
processed and deleted per the inbox workflow). Stage engine decision record:
`docs/adr/013-pinscene-stage-engine.md`. Decision log: `notes/draft-decisions.md` D13.

## Decisions Hamed made (do NOT reopen)

- **GSAP adopted** (core + ScrollTrigger + MorphSVG, free license). First runtime
  dep. Quarantined: `src/lib/widgets/stage/gsap.ts` is the ONLY file importing
  `gsap`; `src/lib/boundaries.test.ts` enforces it and keeps `sim/`+`research/`
  free of gsap/svelte.
- **Histogram AND Gini**, in sequence (GiniStage builds Lorenz from the reader's
  own room; Gini then powers game meters, phase map, sandbox).
- **Ship target**: full buildable version; deployment is a separate later step.
- **Reveal runs are UNSEEDED** (storyboard: "let every run be different") — keep
  concentration claims distributional, never per-run.
- **Language pass deferred** — Hamed: "text is boring, less is better; we will do
  that later." Don't polish prose unasked; DO flag prose changes you must make.

## The two-clocks architecture (ADR-013, one paragraph)

Authored beats = `PinScene` sections: pinned viewport, one GSAP timeline scrubbed
by scroll (reverse-on-scroll free), captions tweened INSIDE the timeline (never
Svelte transitions in scrub context). Scenes are deep modules in
`src/lib/widgets/stage/scenes/` exporting a `BEATS` data table and calling
`attach(BEATS, build)` — the sequencer never branches on scene names. Interactive
widgets = unpinned full-viewport "yield" sections on the reader's clock; stochastic
runs re-run, never scrub. Reduced motion: PinScene drops pin+scrub, seeks the same
timeline via IntersectionObserver. Known limit: no-JS renders a blank page (Vite
SPA, no SSR) — pre-existing, reduced-motion is the working a11y fallback.

## Visual system

`src/lib/widgets/shared/agentStyle.ts`: pastel fill + independent stroke + shape
(circle/triangle/square/pentagon/hexagon), coprime cycles → 30 unique combos.
Palette CVD-validated on the paper background (worst all-pairs ΔE 10.3, floor band
legal because shape is secondary encoding); golden coin `--coin` reserved for money.
CSS tokens in `src/app.css` `:root` mirror it — keep both in sync. Frameless
mandate: no cards/borders around visuals; the one deliberate exception is
`.headline-card` (the manufactured-news motif is content). Styles are display-only
and must never enter the sim (the essay's whole point) — seed-501 winner promise
("a red pentagon with a teal edge", named in prose) is guarded by a test in
`agentStyle.test.ts`.

## Claim discipline shipped with the tax chapter

- Phase diagram: white contour = MEASURED Gini 0.5; dashed curve = FITTED
  τ* ≈ c·β² (c ≈ 0.37, stable across seeds and N — memo in
  `notes/research/interventions.md`). Words "theoretical/law/phase transition"
  stay out of the essay.
- Manual-vs-structural levy comparison: STILL UNCLAIMED (gate open).
- Sandbox progressive designer + interest dial: toys, no policy claims; interest
  mechanism note in `notes/research/extensions.md` (scales `totalDollars`, never
  shares).

## Verify like this

```
npm test          # ~100 fast logic tests incl. boundary + seed guards
npm run build     # must be warning-free
npm run preview -- --port 4173   # then drive headless:
```

Headless: `npm install puppeteer-core` in the session scratchpad (NOT the repo),
launch with `executablePath: '/usr/bin/google-chrome'`, `--no-sandbox`. Pin
sections wrap in `.pin-spacer` divs — index them to scroll to a scene, use
`spacer.top + fraction * (spacer.height - viewportHeight)` for beat positions.
Screenshot beats and LOOK at them. Calibration scripts: `npx vite-node
scripts/phase-calibrate.ts` / `phase-stability.ts`.

## GSAP + Svelte gotchas (each cost a bug this session)

- gsap reads an SVG `transform="translate(x y)"` attr into its x/y — tweens are
  ABSOLUTE. `fromTo(el, {y: -14}, {y: 0})` sends the element to the viewBox top;
  write `{y: POS.y - 14} → {y: POS.y}`.
- CSS `transform: translate(-50%,-50%)` gets clobbered by gsap transforms — use
  `tl.set(el, {xPercent: -50, yPercent: -50})` instead.
- Set `transformOrigin: '50% 50%'` explicitly in tweens on SVG (CSS
  transform-box is not reliably honored by gsap's matrix path).
- Never hide scene elements via CSS opacity/visibility for initial states — use
  `fromTo` immediateRender so no-JS/static keeps the content.
- All GSAP creation inside `gsap.context()` in `onMount`, cleanup `ctx.revert()`;
  PinScene owns this — scenes only fill the passed timeline.

## Open items (the real backlog)

1. Hamed's scroll-through review (`npm run dev`) — expect feel notes: scroll pace
   (`pace` prop per PinScene), cow morph quality, mobile.
2. Reader studies A–D (`notes/research/reader-study.md`) — widgets now exist.
3. Redistribute-to-poorest fork (beat 19 parenthetical still flags it).
4. Full language pass (owner-deferred).
5. Keyboard path for canvas rooms (pointer-only; worst in TaxGame).
6. Deployment (not chosen yet).
7. Deferred seams unchanged: Rust/WASM core, Persian/RTL, audio.

## Untracked local files that are NOT yours

`.clinerules/ .cursor/ .github/ .opencode/ .windsurf/ install.sh` and Hamed's
`AGENTS.md` edit (caveman style rules) — his multi-agent setup. Leave uncommitted;
never delete.

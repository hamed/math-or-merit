# CONTEXT.md — session handoff for agents

Read `AGENTS.md` first (architecture law) and `MEMORY.md` (durable lessons and
owner preferences). This file is the *state* snapshot: what is built, what was
decided, how to verify, what remains. Written 2026-07-06 after the scrollytelling
rebuild shipped; update it when the state moves.

## Where things stand

Branch `claude/interactive-build`. Two passes shipped:
- **M0–M10** (`20ed4c8`…`67770c1`): the scrollytelling rebuild.
- **Round 2, R1–R8** (`d4b9bb0`…`c29f93b`, 2026-07-08/09): Hamed's + five AI
  reviewers' feedback. Reviews live in `reviews/` (his `inbox/hamed-review.md`
  plus six codex lenses + screenshot index); they are his untracked working
  notes, leave them.

~100 vitest tests green, `npm run build` clean, headless QA sweeps (desktop /
mobile 390px / reduced-motion, forward AND reverse scroll) show zero console errors.

The essay is a scroll-driven explorable per Hamed's hand-drawn storyboard —
transcribed durably in `notes/storyboard.md` (the inbox PDF and review.md were
processed and deleted per the inbox workflow). Stage engine decision record:
`docs/adr/013-pinscene-stage-engine.md`. Decision log: `notes/draft-decisions.md` D13.

### Round 2 (R1–R8), what changed and why
- **R1**: opening is TIME-driven (`PinScene driver="time"` — plays on load, no
  scroll needed), title bigger/bolder in `poles` layout (variants `stack`/`center`
  behind an `OpeningScene` prop); belief cloud phyllotaxis, translucent, grows-apart.
  Tax game escalation → fixed **difficulty** (Gentle/Normal/Brutal); escalation was
  contaminating the lesson (every reviewer). The blank-first-viewport blocker (the
  shell's 112px top padding) is gone.
- **R2**: cow story fully acted out — chemist, Einstein-physicist (sun crosses sky),
  sphere, vacuum (face only), triangle hill on a horizon, push/slip/rollback that
  drags the pusher off-screen, real-cow-won't-move coda. Nested-group fix (see MEMORY).
- **R3**: canonical `Coin.svelte` (fixed size — wealth changes coin COUNT); person
  honeycomb lattice; trade = two circles, half-stake, two coins side-by-side, winner
  takes both, flip spins on its vertical axis.
- **R4**: reveal stake `REVEAL_BETA=0.35` (calibrated: median top 75%, p5 47% —
  prose is distributional now, the reveal/prose overclaim blocker is fixed). Finish
  shows a "Morning Ledger" card (winner portrait + pun headline). WinnerStory widget
  DELETED, folded into RevealRun; curated seeds + seed-501 guard test retired.
- **R5**: `DistributionStage` = BinsStage+AxisStage merged (room→sorted→binned→log);
  `GiniStage` rebuilt from first principles (equal circles merge → diagonal; unequal
  → sag; hatch; slider). Winner halo now traces the winner's OWN shape (dashed
  pentagon for a pentagon) — in `roomRenderer`, so every canvas room inherits it.
- **R6**: stake dial 1–99% step 1 + `HistoMini`/`LorenzMini` sidebar; crowd gets a
  Lorenz sidebar + reset; tax-only demo uses plain circles.
- **R7**: phase map is PLAYED into existence — reader runs live rooms with two dials,
  each paints its cell; "fill in the rest" completes the grid; measured contour +
  fitted curve unchanged. (Fixed: it polled `world.trades`; LeviedWorld exposes
  `.ticks`.)
- **R8**: sandbox choices-row + slider-grid, circles/shapes look toggle, Gini moved
  to the plot's empty top-left, horizontal bracket rows; tax game "tax the big five"
  buttons = keyboard/SR path for the pointer-only canvas.

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

1. Hamed's scroll-through review (`npm run dev`) — feel notes on the round-2 work.
2. Title layout: `poles` shipped; `stack`/`center` variants one word away in
   `essay.en.svx` (`<PinScene driver="time"><OpeningScene layout="…" /></PinScene>`).
3. Interest renormalization (reverse-levy) — owner still deciding; note in
   `notes/research/extensions.md`, do NOT build until he says.
4. Ending scene: owner said "not clear about it" — still the old ClosingScene;
   revisit once the round-2 tone is settled.
5. Reader studies A–D (`notes/research/reader-study.md`) — widgets exist.
6. Redistribute-to-poorest fork (beat 19 parenthetical still flags it).
7. Full language pass (owner-deferred; round 2 added prose — all flagged to him).
8. Deployment (not chosen yet).
9. Deferred seams unchanged: Rust/WASM core, Persian/RTL, audio.

## Untracked local files that are NOT yours

`.clinerules/ .cursor/ .github/ .opencode/ .windsurf/ install.sh`, Hamed's
`AGENTS.md` edit (caveman style rules), and `reviews/` (his + AI review notes and
capture scripts) — his multi-agent setup. Leave uncommitted; never delete.

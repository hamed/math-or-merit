# CONTEXT.md — session handoff for agents

Read `AGENTS.md` first (architecture law) and `MEMORY.md` (durable lessons and
owner preferences). This file is the *state* snapshot: what is built, what was
decided, how to verify, what remains. Written 2026-07-06 after the scrollytelling
rebuild; last updated 2026-07-16 after the sandbox-core rounds (R9–R11e).

## Where things stand

On `main`. Passes shipped:
- **M0–M10** (`20ed4c8`…`67770c1`): the scrollytelling rebuild.
- **Round 2, R1–R8** (`d4b9bb0`…`c29f93b`, 2026-07-08/09): Hamed's + five AI
  reviewers' feedback. Reviews live in `reviews/` and `inbox/hamed-review*.md`;
  they are his untracked working notes, leave them.
- **Rounds 3–6, R9–R11e** (`aca07ca`…`8fbe360`, 2026-07-13…16): the sandbox
  became the full-screen reusable core — see "The sandbox core" below.

~156 vitest tests green, `npm run build` clean, headless QA sweeps (desktop /
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

## The sandbox core (rounds 3–6, owner reviews 00–03)

The finale `Sandbox.svelte` is now THE reusable machine: full-screen 5-column
grid (room 3×2, six 1:1 plots, dials column, button grid), `layout`
(`full`/`column`) + `panels` + `controls` props so earlier beats can become
presets of it. Pieces (all in `src/lib/widgets/sandbox/`):

- `SandboxWorld` — toy world; UNCLAMPED dials on purpose (expert mode);
  `RoundSeries` = t=0-anchored per-round series with pair-averaging downsample
  (never a moving window); `measureToy` = chaos-tolerant Gini (negative wealth
  allowed); inlined flat levy (research/ primitives keep their validation).
- `PlotFrame` + `ticks.ts` + `fits.ts` — one chrome for every plot: round-number
  ticks only (unit lives in the axis label), shared geometry/fonts, px clamp so
  1e300 never writes exponent paths. Site conventions: **axis click = log↔linear
  (zeros drop off log), body click = cycle (bins / views / map styles), dblclick
  = zoom, Escape closes, hover = insights** (median/mean, power-law tail fit on
  top 20%, −%/decade lognormal line, top-1%/median markers, peaks).
- `phaseGrid.svelte.ts` — the phase record: NOTHING precomputed. The Sandbox
  ticker watches runs settle (50-round Gini windows, two consecutive within
  0.015) and solidifies tail averages, keyed by exact dial stops AND n (settled
  Gini is finite-size — never mix n). localStorage + CSV export/import/wipe.
  Map draws cells/dots/shade (body-click cycles; owner hasn't picked a default);
  hover-probe previews cross-sections; closed-form dashes only where theory
  exists (tax=0 → Gini→1, stake=0 → stays 0).
- `newsroom.ts` + `NewsFlash` — two papers, ONE per print, chosen by the press
  pass (Ledger 🎩 top-left / Gazette 📣 bottom-right): subject-aware satire
  (`frontPageFor`), Ledger pivots anti-tax when the levy leveled the room,
  Gazette humanizes; button case shoots winner (Ledger) / poorest (Gazette).
  'On click' toggles the mini-game: tax the agent, or 📸 photograph them.
- `StopSlider` — every simulation control is a dial over curated round stops
  (rates 0…0.001…99.99%…1; people 2…2048 powers of two; money 1-2-5 to $1M);
  the '123' expert toggle flips them all to raw unclamped inputs; the watchdog
  raises THE ECONOMY BROKE on non-finite wealth.

Svelte gotchas from these rounds (each cost a bug): an absolutely-positioned
grid child WITH a grid-area resolves inset against its area — drop the
placement when zooming; class-instance properties are not reactive — read them
through revision-keyed deriveds; single-click actions must be gated
(`gatedClick`, e.detail) or they fire inside dblclick zooms; `roomPositions`
with width 0 used to make rows=∞ and hang the renderer (guarded + regression
test).

## Visual system

`src/lib/widgets/shared/agentStyle.ts`: pastel fill + independent stroke + shape
(circle/triangle/square/pentagon/hexagon; `EXTENDED_SHAPES` adds triangleDown/
heptagon/octagon for the sandbox's `randomStyles` only — the deterministic cycle
and every earlier beat are untouched), coprime cycles → 30 unique combos.
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
- Sandbox: interest REMOVED (was inert — scaled `totalDollars`, never shares;
  note kept in `notes/research/extensions.md`); progressive brackets REMOVED for
  good — progressivity ships later as ONE parametric rate-of-log-wealth dial
  (dummy slider holds the slot). Still toys, no policy claims.

## Verify like this

```
npm test          # ~100 fast logic tests incl. boundary + seed guards
npm run build     # must be warning-free
npm run preview -- --port 4173   # then drive headless:
```

Headless: `npm install playwright-core` in the session scratchpad (NOT the
repo), launch chromium with `executablePath: '/usr/bin/google-chrome'`. For the
sandbox, drive the real flows: Run at 16×, drag dials by stop INDEX, click-tax
the room, break the news on both passes, dblclick-zoom, Escape, expert '123'
with tax −50 until THE ECONOMY BROKE appears, and hold dials ~3 s so phase
points solidify (then reload — they must persist). Check horizontal overflow at
390 px AFTER the whole flow, not just on load. Pin
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

1. Progressivity dial: owner-promised parametric rate ~ log wealth, ONE slider;
   the dummy slider and the `endRound` seam are waiting for it.
2. Phase map default display style: cells / dots / shade all live (map body
   click cycles) — owner hasn't picked; also consider stamping the reader's own
   run-dots onto any future backdrop.
3. Turn earlier beats into `Sandbox` presets (`layout="column"` +
   `panels`/`controls`) — the seam exists, nothing migrated yet.
4. Ending scene: owner said "not clear about it" — still the old ClosingScene.
5. Reader studies A–D (`notes/research/reader-study.md`) — widgets exist.
6. Redistribute-to-poorest fork (beat 19 parenthetical still flags it).
7. Full language pass (owner-deferred; rounds added prose — all flagged).
8. Deployment (not chosen yet).
9. Deferred seams unchanged: Rust/WASM core, Persian/RTL, audio.
10. Title layout variants (`stack`/`center`) still one word away in
    `essay.en.svx`.

## Untracked local files that are NOT yours

`.clinerules/ .cursor/ .github/ .opencode/ .windsurf/ install.sh`, Hamed's
`AGENTS.md` edit (caveman style rules), and `reviews/` (his + AI review notes and
capture scripts) — his multi-agent setup. Leave uncommitted; never delete.

# CONTEXT.md — session handoff for agents

Read `AGENTS.md` first (architecture law) and `MEMORY.md` (durable lessons and
owner preferences). This file is the *state* snapshot: what is built, what was
decided, how to verify, what remains. Written 2026-07-06 after the scrollytelling
rebuild; last updated 2026-08-25 after the illustrated-cast rounds (R13–R15a).

## Where things stand

On `main`, deployed. Passes shipped:
- **M0–M10** (`20ed4c8`…`67770c1`): the scrollytelling rebuild.
- **Round 2, R1–R8** (`d4b9bb0`…`c29f93b`, 2026-07-08/09): Hamed's + five AI
  reviewers' feedback. Reviews live in `reviews/`; they are his untracked
  working notes, leave them.
- **Rounds 3–6, R9–R11e** (`aca07ca`…`8fbe360`, 2026-07-13…16): the sandbox
  became the full-screen reusable core — see "The sandbox core" below.
- **R12a–e** (2026-07-16/18): the cow got Hamed's hand-drawn face, then an
  elaborate cast was built and REJECTED in favour of minimal characters.
- **R13–R15a** (`89e9e4e`…`76f8faa`, 2026-08-25): the illustrated cast — see
  "The illustrated scenes" below. This SUPERSEDES the drawn-SVG cow and person
  scenes, and reverses R12e's minimal-character verdict.

163 vitest tests green, `npm run build` clean apart from two known a11y warnings
in `PlotFrame.svelte` (axis-toggle `<rect>` with no key handler), headless QA
sweeps (desktop / mobile 390px / reduced-motion, forward AND reverse scroll)
show zero console errors.

### Deployment

Live, unlisted: **https://hamed.github.io/math-or-merit/**

`.github/workflows/deploy.yml` builds on every push to `main` and gates on the
test suite. Two build-time seams keep review scaffolding out of the essay:
`BASE_PATH` sets Vite's base (project pages serve from `/<repo>/`; defaults to
`/`), and `VITE_REVIEW_ISSUES_URL` switches on the reviewer footer — a public
build leaves it unset and renders no footer.

**The site is unlisted, NOT private.** GitHub Pages has no access control outside
Enterprise Cloud, and Pages on the Free plan requires a public repo. Discovery is
all we control: `public/robots.txt` disallows everything and `index.html` carries
`noindex`. Do not remove either while the draft is under review.

**Analytics: GA4 (`G-C1RKMJZHLE`), tag in `index.html`.** It measures the
unlisted review copy too — `noindex` stops crawlers, not measurement — so filter
your own traffic before reading any of it as an audience.

**Before the site goes public, swap GA4 for a cookieless counter** (Plausible,
Umami, GoatCounter, Cloudflare). Reason: GA4 sets cookies and ships data to
Google, which in the EU needs a consent banner, and a modal landing on top of a
timed teletype opening is the worst possible first impression for this essay —
owner's call, 2026-08-26. A cookieless counter needs no banner and still answers
the only questions worth asking here: did they reach the sandbox, and where did
they leave. Add two or three scroll-depth events at the same time. Ten-minute
change; do NOT do it while the copy is still unlisted, GA is fine until then.

Pushing needs a workaround: the owner's ssh agent refuses to sign
(`agent refused operation`). Use the key directly —
`GIT_SSH_COMMAND='ssh -i ~/.ssh/hamed -o IdentitiesOnly=yes' git push`. The `gh`
token lacks the `workflow` scope, so an HTTPS push that touches
`.github/workflows/` is rejected.

### The illustrated scenes (R13–R15a, 2026-08-25)

The two authored SVG morphs are gone. The joke and the reduction are now the
owner's illustrations, cut into plates and switched as comic panels.

- **`CowCastScene`** — seven plates, eight beats. The experts fail in order of
  increasing abstraction (biologist → chemist → physicist), which is the spine of
  the joke: each answers in his own model and none produces milk. Then sphere,
  vacuum, and a football pitch. The uphill push was REPLACED, not supplemented:
  it argued the same a fortiori point and the essay cannot close on both.
  Football was chosen because the whole essay is a fair game with a lopsided
  outcome, so the metaphor family matches the subject. The closing beat pushes
  2.4× into the ball.
- **`PersonTradeScene`** — eleven plates, twelve beats, and ONE circle element
  from the reduction through the trade to the ring. See ADR-015; this merge is
  load-bearing, do not split it back apart.

Plate pipelines are reproducible: `art/cast-scene/process.sh` and
`art/person-scene/process.sh`. Both key ink luminance to alpha and re-tint to
`--ink`, so plates sit on the paper instead of arriving as white cards. Sources
live beside each script in `source/`, untracked (they are ~16MB of PNG); the
committed artefacts are the WebP plates — 2.3MB for the cow, 452KB for the
person.

Superseded scenes are in `archive/scenes-pre-r13/` (gitignored, so they are on
the owner's disk and in history, not in the tree): `CowScene.svelte`,
`cow-geometry.ts` + test, `PersonScene.svelte`, `TradeScene.svelte`, `paths.ts`.
`SPHERE` had no users left once the circle became an agent path.

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
- **Ship target**: full buildable version. Deployed 2026-08-25 as an unlisted
  GitHub Pages site (see Deployment above).
- **Reveal runs are UNSEEDED** (storyboard: "let every run be different") — keep
  concentration claims distributional, never per-run.
- **Language pass deferred** — Hamed: "text is boring, less is better; we will do
  that later." Don't polish prose unasked; DO flag prose changes you must make.
- **Illustrated characters ARE the style now** (R13–R14), reversing R12e's
  minimal-character verdict. The rejection then was of SVG personas *we* would
  draw; these are his own finished illustrations. `art/personas/README.md`
  records the superseded decision. Don't invent characters — use what he ships.
- **Report density** — he reads every reply and judges information per word.
  Changed / Verified (numbers only) / Needs-you. State your reading of an
  ambiguous request in ONE line before doing expensive work; misreading cost two
  full rebuilds in R14a/R14b.

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
  transform-box is not reliably honored by gsap's matrix path). The symptom is
  specific: the element scales about its bounding-box CORNER and drifts up-left
  as it shrinks. But do NOT apply a percentage origin to non-circular shapes —
  '50% 50%' is the BOUNDING BOX centre, which for a triangle or pentagon is not
  the centroid its path is drawn around, and it shoves them off position. Name
  the elements that actually need it.
- `'label+=-0.025'` is NOT parsed as a negative offset; it lands somewhere else
  silently and strands elements. Compute absolute numeric positions from the
  cumulative beat lengths (the same sums PinScene labels with).
- Cross-fading TRANSPARENT plates is impossible: with no opaque backdrop both
  images show at once and the ink washes out. A short fade still ghosts, because
  a scrubbed timeline lets the reader park inside it. Use `ease: 'steps(1)'` so
  alpha is only ever 0 or 1.
- A scene's own `.foo svg` rule only TIES `PinScene`'s
  `.pin-scene :global(.scene-art svg)` on specificity — Svelte scopes it as
  `.foo svg.svelte-xxx` — and source order then decides, silently. Name two
  classes (`.scene-art.foo svg`) to win.
- `PinScene` caps stages at `68svh`, which assumes a 280-unit viewBox. A scene
  with a taller box must scale that cap (`calc(68svh * H / 280)`) or it clamps
  sooner and renders at a smaller px-per-unit than its neighbours.
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
7. Full language pass (owner-deferred; rounds added prose — all flagged). R13–R15
   added three lines that are NOT his: the biologist caption, "Keep going. Take
   the face too.", and the football line's tightening.
8. Two a11y build warnings in `PlotFrame.svelte` (axis-toggle `<rect>`, no key
   handler) — shipping in the live build.
9. CI logs a Node 20 deprecation for `actions/checkout@v4` and friends.
10. Trader entrance/exit shapes scale about their bbox corner in the crowd
    entrance (pre-existing, cosmetic, ends at scale 1 so it never rests wrong).
11. Deferred seams unchanged: Rust/WASM core, Persian/RTL, audio.
12. Title layout variants (`stack`/`center`) still one word away in
    `essay.en.svx`.
13. Analytics: swap GA4 for a cookieless counter before the site is public, and
    add scroll-depth events — no consent banner in front of the opening. See the
    deploy section above.

## Untracked local files that are NOT yours

`.clinerules/ .cursor/ .opencode/ .windsurf/ .github/copilot-instructions.md
install.sh elevator.md`, his `.gitignore` edit, `reviews/` (his + AI review notes
and capture scripts), the rejected `art/cast/` studies, `art/cow/*.png`, and the
remaining `inbox/` reference photos — his multi-agent setup and working material.
Leave uncommitted; never delete. `.github/workflows/deploy.yml` IS tracked; the
rest of `.github/` is his.

`archive/` is gitignored by design: it holds superseded code kept for reference
only, and vitest is configured to skip it (its `exclude` REPLACES the defaults
rather than extending them, so the usual entries are spelled out in
`vite.config.ts`).

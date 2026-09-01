# CONTEXT.md — session handoff for agents

Read `AGENTS.md` first (architecture law) and `MEMORY.md` (durable lessons and
owner preferences). This file is the *state* snapshot: what is built, what was
decided, how to verify, what remains. Written 2026-07-06 after the scrollytelling
rebuild; last updated 2026-08-26 after the prose pass and the opening/trade
rounds (R16–R28).

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
- **R16–R28** (`…`…`8da4b39`, 2026-08-25/26): the opening, the fable and the
  trade were rewritten with the owner line by line — see "The prose pass" below.
  The belief word cloud is GONE, the money is a photographed coin, and the two
  traders now start EQUAL.
- **R31** (`3569a60`…`03b3db3`, 2026-08-27, branch `scroll-and-opening`): the
  reading machine — two scroll traps killed, space pages by beat, a chapter
  index with a shareable `#sandbox`, the owner's four silence plates, his three
  slides after the title, and every multi-line block ranged left. See below.
- **R29–R30** (`3165202`…`81b74fa`, 2026-08-27, branch `sandbox-modules`): the
  earlier widgets were moved onto the sandbox's own parts — see the two
  sections below. R29 is invisible (one world class instead of three, one
  meter pill instead of five); R30 changes three pictures on purpose, under
  the owner's rule "change it if the change is an improvement".

175 vitest tests green (R29 retired two duplicate world classes and their
tests; R30 and R31 each added one), `npm run build` clean apart from three known warnings — two a11y
in `PlotFrame.svelte` (axis-toggle `<rect>` with no key handler) and one
unused CSS selector in `PinScene.svelte` — headless QA
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
  fitted curve unchanged. (Fixed: it polled `world.trades`; LeviedWorld exposed
  `.ticks`. R29 retired LeviedWorld, so `.trades` is right again.)
- **R8**: sandbox choices-row + slider-grid, circles/shapes look toggle, Gini moved
  to the plot's empty top-left, horizontal bracket rows; tax game "tax the big five"
  buttons = keyboard/SR path for the pointer-only canvas.

## The prose pass (R16–R28, 2026-08-25/26)

**`notes/prose.md` is where prose is edited now.** It holds every word the reader
sees, in order, each line tagged (`[cow.3]`, `[human.8]`), with a `> picture:`
note saying what is on screen while that line is read and a `! keep true:` line
wherever a claim is load-bearing. The owner edits ONLY that file; carrying it
back into `essay.en.svx`, the scenes and the widget labels is the agent's job.
Do not ask him to edit the essay directly — that was tried and he called it
inefficient.

What changed in the essay itself:

- **The opening title is a slot machine.** The third line spins seventeen folk
  explanations, passes "Math", shows most of the word behind it, and settles
  back with a damped oscillation (`elastic.out`). `BeliefCloudScene` was DELETED
  for it (archived under `archive/scenes-pre-r17/`) along with its two captions:
  the reader meets the question once. Family money and class are ON the reel on
  purpose — spinning past the strongest answers is the point.
- **Empty stages carry the words.** `CowCastScene.STAGE_TEXT` is a table of
  lines that stand in where a picture would be: the bridge from the title
  ("Math." / "Let me show you what I mean by that."), the three silences after
  the experts fail, and the sentence about models. Lines sharing an `until` are
  one card and pile up; a line can be `big`. `CastFrame.until` lets a plate leave
  before the next one arrives, which is what opens those gaps.
- **The money is a real coin, both faces** (`Coin.svelte`, plates in
  `scenes/coin/`, pipeline `art/coin/process.sh`): Mongol Bank 1000 tögrög,
  Karl Marx, 2019. Sixteen coins make a whole person. The decider is the SAME
  coin with each side painted in a trader's colour (`tint`, `mix-blend-mode:
  color`) — one object, and the colour that lands still wins. **Rights are open**
  — see `notes/research/narrative-sources.md`; the owner has asked the mint for
  permission and sponsorship.
- **The traders start EQUAL.** Three scripted rounds in coins — 8-8, 4-12, 6-10,
  9-7 — so the first toss is what makes one of them poorer and the "half of the
  POORER one" rule is taught at the moment it starts to matter. They finish
  looking level, which is the illusion the room then takes away. `ROUNDS` and
  `HOLDINGS` are data; six tests assert conservation and the stake rule.
- **Captions are placed off the art, per beat.** `BeatSpec.artBottom` says how
  far down its box a beat's ink reaches; `PinScene` measures the box and puts the
  caption one line under that, re-measuring on refresh and whenever the value
  changes. Two guards: a floor so a scene that zooms cannot push the words off
  screen, and a paper halo (`.over-art`) when art ends up behind them.
- **Plate switching is deterministic**: one SHOW and one HIDE per plate at
  absolute positions, so exactly one is visible in either direction at any scrub
  speed.
- **Widgets are content-height** and the sandbox snaps flush to the top (it is
  exactly one screen tall and cancels `--snap-pad` for itself).

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

## R29 — the widgets moved onto the sandbox's parts (2026-08-27, branch `sandbox-modules`)

Backlog item 3 opened, at the layer where it costs nothing on screen.

- **One world, not three.** `LeviedWorld` and `TaxWorld` are DELETED.
  `SandboxWorld` was already the same machine — same share array, same
  `RandomSource`, same `applyYardSaleTrade` in the same order, same
  equal-dividend levy — so `PhaseDiagram` and `TaxGame` now build one and set
  `beta` / `taxRate` / `taxEvery` as fields. The former `TaxOnlyDemo` did too
  until Phase 4 replaced it with the coin-by-coin `LevyLesson`. `SandboxWorld`
  gained the one thing it lacked, an optional `initialWealth`; `reset` returns to it. Its members are validated
  even though the RUN is not — that closes audit finding 10, which
  `LeviedWorld` had left open.
- `judgeGame` moved to `tax/judge.ts`. `TaxWorld.escalationPerLevy` is gone;
  only its own test used it, and R1 removed escalation from the game.
- `TaxGame`'s readout lost `* ROOM_N * START_DOLLARS` because `levyAgent`
  returns dollars where `TaxWorld.levy` returned a share. Same number printed.
- **The meter pill** (`.meter`/`.meter-fill`/`.meter-label`) was copied into
  five widgets with three small drifts. It lives in `app.css` now behind
  `--meter-bg`, `--meter-size`, `--meter-label-size`.
- Verified: 173 tests green (178 before; the two escalation tests and four
  duplicates went, six new ones came), build carries only the three
  pre-existing warnings, and every `.widget` was pixel-diffed main vs branch
  at 1280 px and 390 px — **ten of eleven byte-identical**. The eleventh is the
  sandbox, which differs against ITSELF by the same amount (`randomStyles`).
  Driven flows match main: tax game 4 taps ≈ $600 shared back, tax-only room
  0.97 → 0.02 in 37 levies (identical, it is deterministic), phase cell 201,000
  trades and one painted square.
- NOT done, awaiting the owner: the visible half of backlog item 3 (widgets as
  `Sandbox` presets), mini charts → `PlotFrame` plots, `PhaseDiagram` writing
  into the shared `phaseGrid` record, and one shared newspaper card for
  `RevealRun` + `NewsFlash`. Each of those changes the picture.

## R30 — sandbox parts in the earlier beats, where they read better (2026-08-27)

The owner's rule for this round: **change the picture if the change is an
improvement.** Four candidates were tried; three shipped, one was reverted on
the evidence.

- **The reveal's newspaper is the sandbox's** (`NewsFlash`). It prints ON the
  room — camera flash on the winner, the photo flies into the polaroid slot,
  the headline sets — instead of arriving as a card underneath. The winner's
  headline is unchanged: `frontPageFor` routes a 99th-percentile subject to
  `ledgerPage`, and with `taxRate` 0 that returns `headlineForStyle`, the same
  shape pun as before. The reader can also photograph anyone else: tapping the
  canvas, or **"Photograph the last-placed"** for the keyboard path — the
  Ledger on a poor subject prints "A cautionary tale of poor choices", which
  is the chapter's argument in one line.
- `collectStats` no longer takes a `SandboxWorld`. It takes a structural
  `StatsSource` (`n`, `startDollars`, `taxRate`, `dollarsOf`, `volume`), so the
  reveal's plain `SimEngine` gets a front page too; `roomStatsSource(world)`
  adapts the sandbox. The old inline `.headline-card` and its dead app.css
  rules are gone — the frameless mandate has one fewer exception.
- **TimeLapse runs a `SandboxWorld` and shows a `TimeSeries`.** Gini solid,
  top share dashed: the crown visibly changes hands (top share dips to 50%
  and recovers) while Gini stays pinned near 1. A round here is **1,000**
  trades, not the usual 100 — this beat accelerates to 400k trades a frame,
  and a round costs a Gini over the whole room (measured: +15 ms a frame at
  100, +2 ms at 1,000).
- **PhaseDiagram's two sliders are `StopSlider`s**, stopped on the map's own
  BETAS and TAXES. Same snapping as before, the finale's vocabulary, and the
  widget is 55 px shorter on desktop and 86 px on mobile.
- **CrowdRun keeps its bespoke canvas histogram. REVERTED, do not retry
  without changing `Histogram` first.** The sandbox chart looks strictly more
  capable and is not: `StickyRange` deliberately follows the minimum DOWN
  ("nothing goes off scale"), so after two million trades the poorest agent at
  1e-49 drags the x-axis to 1e-49…0.1, the tick labels collide, and the 809
  below a cent plus the $2.4M winner — the whole point of the beat — vanish.
  The bespoke chart floors at `DUST_DOLLARS` with a dashed dust wall and
  prints per-decade counts. Screenshots of both are in the R30 session notes.
  Reopening this needs a floor/dust option on `Histogram`, and then the two
  charts share little but the frame.
- **The square-frame rule for reuse outside the sandbox**: `PlotFrame` is a
  fixed 170-unit square with 8–9.5 px type, drawn for a ~250 px tile. Past
  ~14 rem it reads oversized and clumsy. Cap any prose-side plot
  (`max-inline-size`) instead of letting it fill the column — that is why
  TimeLapse's is 12 rem.
- Verified: 174 tests green, build carries the same three pre-existing
  warnings, zero console errors. Pixel diff main vs branch at 1280 px and
  390 px: eight of eleven widgets byte-identical; the three that differ are
  TimeLapse, PhaseDiagram and the sandbox (which differs against itself).
  Driven: reveal winner page + last-placed page, TimeLapse to 3.3M trades and
  100%, phase cell painted at stake 40% / tax 2% → Gini 0.66, no horizontal
  overflow at 390 px after the whole flow.


## R31 — the reading machine: scroll, keys, an index, and the silence (2026-08-27)

The owner read the whole thing on his own screen and the complaints were about
the READING, not the argument. Every one of them was a real bug, and two were
severe enough that the essay could not be finished by ordinary scrolling.

### The scroll stick was two traps, both measured

At 1280x900 with 120px wheel steps, on the shipped build:

1. `scroll-snap-type: y proximity` on `html` with `scroll-snap-align: center`
   on every `.widget`. A widget shorter than the viewport makes a snap area a
   wheel step cannot leave, so Chrome re-centres it forever. The page **died at
   y=29792 and 162 consecutive steps moved zero pixels.** Both rules are gone.
   `scroll-padding-block` stays — it still governs `scrollIntoView`.
2. The sandbox's own `maybeSnap` pulled any rest within a quarter viewport of
   its top back to the top, in BOTH directions, so the closing was unreachable
   (the position oscillated +4/-4px forever). It now snaps only in the
   direction the reader is already travelling and re-arms only after they leave
   the zone.

After: the same run reaches the end with ZERO stalls. **Do not reintroduce CSS
snap without re-running that wheel test** (`scrolldiag`-style: wheel 120px,
count steps with delta <= 2).

### Space pages by beat

There was no handler at all — space was the browser's ~0.9-viewport page-down
against beats 0.6-1.2 viewports long, so it always landed mid-fade and drifted
further out of phase with every press. Scroll-driven `PinScene`s now register
their resting positions in a module-level `navs` set; space goes to the next,
Shift+Space to the previous, and past the last beat the key is handed back to
the browser. It never fires while a control has focus. Verified: sixteen
presses, every caption at opacity 1.00.

`BeatSpec.restAt` is the seam that makes it honest — a scene that draws its own
words says when they have all landed, because the sequencer can only time the
captions it owns. `CowCastScene` computes it from its own text table.

`scrub` 0.6 -> 0.3: the tween trailed the scroll by six tenths of a second,
which is what "one more scroll finishes the text" was.

### A card-timing bug that had been shipping

A three-line stage-text card in a 1.4-long beat put the last line's fade-in at
+1.05 and the card's exit at +1.15, so **"but some of them are useful." had
never been visible.** The timing constants are exported now (`TEXT_LEAD`,
`TEXT_GAP`, `TEXT_FADE`, `TEXT_EXIT`, `textLineOffset`), the lengths are 1.7,
and `beats.test.ts` proves every line finishes arriving before its card leaves.

### The chapter index (`src/lib/nav/`)

NOT a progress bar — that was proposed and rejected, correctly: the two fables
are 63% of the essay's scroll and a small part of its argument, so a filling
bar reads "nearly done" through the whole middle. Instead a line of type in the
top-right names the section you are in; press it and the list opens; press an
entry and it scrolls there.

`Chapter` is a marker written into the prose (id, label, no ink) and
`chapters.svelte.ts` is only the register they sign — the engine never names a
chapter. Sixteen of them, every label the section's own heading. Every chapter
has a stable fragment, so **`#sandbox` is a shareable link** and a cold load on
it lands flush on the machine (`flush` cancels the page's scroll padding for
the one section that is exactly a screen tall). Furthest chapter is remembered
in `localStorage` and offered as one line at the foot of the list — never a
modal. Hidden over the opening.

Two collisions: `--index-gutter` keeps the sandbox's stats row clear of the
corner (it is the only full-bleed section that reaches it), and on a phone,
where the essay column runs edge to edge and a text halo was not enough, the
label becomes a small paper pill.

### The silence is acted now, in four panels

The owner drew the pause: everyone waits on Albert, the cow turns and looks at
US, the cow answers ("Moo!", inked into the plate), and only then does Albert
scratch his head. `scratch` is a beat with NO words — the picture is the beat.

This SUPERSEDES "the empty stage is the joke". The three lines moved from
`STAGE_TEXT` (which is for beats carrying no picture) to ordinary captions, and
`beats.test.ts` already enforced that split, so the move was not optional.
Plates renumbered so filename order is story order: the new four are 03-06 and
physicist/sphere/vacuum/pitch moved to 07-10. The pipeline recomputes its
shared crop across all ten studio frames, so old and new are cut to one box.

**The cast is now 3.4MB of WebP, up from 2.3MB**; the whole build is ~4.3MB of
assets. Flagged to the owner, not acted on. If the missing-figure report
recurs, this is the first thing to look at.

### The three slides after the title, and left ranging

"Math." is GONE at the owner's call — the reel already lands on it, and saying
it again alone spent the moment. In its place: the promise, the question it is
for, and the handover ("let me tell you a story first…"), one beat each.

Then, everywhere: **multi-line blocks are ranged left**, stage text and
captions both. Captions decide by MEASUREMENT (taller than one line, however
it got there), re-measured on resize. A single line is untouched — the box
shrink-wraps and auto-margins, so it sits where a centred one did. The biggest
gain is the closing, where the honesty bill is five lines and the one after it
is eight.

### Gotchas this round cost

- `max-inline-size: 34ch` on a flex CONTAINER resolves `ch` against the
  container's font size, not its children's — a 34ch cap came out ~270px and
  wrapped every line of a 3.4rem card.
- A shared type clamp with a floor (1.9rem) re-wraps authored lines on a 390px
  screen. An authored line that becomes two read lines defeats the whole point;
  scale further down before the floor.
- Two `.stage-text p` blocks in one stylesheet: the second silently won and
  undid the mobile scale. Check for duplicate selectors after a CSS edit.
- Preloading: only fonts were waited for. An SVG `<image>` paints nothing until
  its bitmap decodes, so `PinScene` now decodes every plate in its subtree and
  then refreshes. This is a HARDENING, not a confirmed fix — the missing-figure
  report could not be reproduced in six controlled runs including heavy
  throttling.

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
  a scrubbed timeline lets the reader park inside it. Both illustrated scenes now
  use one `tl.set(el, {autoAlpha: 1})` at the plate's beat and one
  `tl.set(el, {autoAlpha: 0})` where it leaves — no window at all to park inside.
- gsap silently DROPS CSS custom properties on SVG elements: `tl.set(svg,
  {'--art-bottom': 0.9})` sets nothing. Per-beat values belong in the beat table
  (`BeatSpec.artBottom`), read by PinScene on update.
- A pinned scene clips its own overflow, and it is only as wide as the essay
  column (`.essay-shell` 64rem minus padding). A stage asking for `min(94vw,
  62rem)` silently loses its edges — that is what truncated the ring. Cap stage
  art with `min(100%, …)`.
- `scroll-padding-block` on `html` shifts every snap point. A widget that is
  exactly one viewport tall must cancel it (`scroll-margin-block: calc(-1 *
  var(--snap-pad)) 0`) or it rests low and loses its own bottom edge.
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
- There is NO `vitePreprocess` in `svelte.config.js` (only mdsvex), so Svelte's
  own TS stripping is all there is, and it does not accept an optional
  parameter in a function declaration: `function f(seed?: number)` fails the
  BUILD with `Expected ',', got '?'` while `npm test` stays green. Write
  `seed: number | undefined = undefined`, or give the parameter a real value.

## Open items (the real backlog)

1. Progressivity dial: owner-promised parametric rate ~ log wealth, ONE slider;
   the dummy slider and the `endRound` seam are waiting for it.
2. Phase map default display style: cells / dots / shade all live (map body
   click cycles) — owner hasn't picked; also consider stamping the reader's own
   run-dots onto any future backdrop.
2b. **PhaseDiagram onto the shared `phaseGrid` record** (the R30 item that was
   priced and deferred). The prize is continuity: the rooms the reader plays at
   beat 9 are still on the finale's map, persisted and CSV-exportable. The
   blocker is that `phaseGrid` keys points by n, and `PEOPLE_STOPS` has no 100.
   Fixing it means N 100→128, `LEVY_EVERY` 100→128, and re-running
   `phase-calibrate.ts` + `phase-stability.ts` — which MOVES the printed fitted
   c ≈ 0.37. A calibration job under claim discipline, not a refactor.
2c. **CrowdRun's histogram**, if `Histogram` ever grows a floor/dust option.
   See R30 for why the plain swap fails. Even then it is a judgement call: the
   bespoke chart also prints per-decade counts.
2e. **"Looks like an embedded image until it gets to stage, then snapped."**
   The owner asked for this and I could not tell what he is seeing — the pinned
   sections already scroll up in normal flow and pin at top-top. Ask him what
   is on screen when it looks wrong (blank paper, or art in the wrong place)
   before building anything.
2f. **The figure that sometimes does not appear** (`person/00-figure.webp`).
   NOT reproduced in six controlled runs including heavy throttling; the plate
   show/hide fired correctly every time. `PinScene` now decodes plates before
   refreshing, which is the best remaining candidate. R31 also added 1.1MB of
   cast plates, which makes the suspected cause MORE likely, not less. If it
   recurs, get the browser and the position, and consider loading each scene's
   plates only as the reader approaches it.
2d. `LorenzPlot`, `CcdfChart`, `GiniCurve` and `PhaseMap` still have no
   importer outside `sandbox/`. Checked in R30, and that is the right answer
   for now: `GiniStage` is an explainer rather than a plot, the 10rem sidebars
   are too small for a 170-unit square, no beat shows a CCDF, and `GiniCurve`
   measures a different quantity from StakeDial's observations list. Do not
   force these in for tidiness.
3. Turn earlier beats into `Sandbox` presets (`layout="column"` +
   `panels`/`controls`) — the seam exists. R29 did the invisible half (they all
   run on `SandboxWorld` now); the visible half is still unbuilt and needs the
   owner, because it replaces the mini charts, the sliders and the toolbars.
4. Ending scene: owner said "not clear about it" — still the old ClosingScene.
5. Reader studies A–D (`notes/research/reader-study.md`) — widgets exist.
6. Redistribute-to-poorest fork (beat 19 parenthetical still flags it).
7. Full language pass (owner-deferred; rounds added prose — all flagged). R13–R15
   added three lines that are NOT his: the biologist caption, "Keep going. Take
   the face too.", and the football line's tightening.
8. Three build warnings, all shipping in the live build: two a11y in
   `PlotFrame.svelte` (axis-toggle `<rect>`, no key handler) and one unused CSS
   selector in `PinScene.svelte`.
9. CI logs a Node 20 deprecation for `actions/checkout@v4` and friends.
10. Trader entrance/exit shapes scale about their bbox corner in the crowd
    entrance (pre-existing, cosmetic, ends at scale 1 so it never rests wrong).
11. Deferred seams unchanged: Rust/WASM core, Persian/RTL, audio.
12. Title layout variants (`stack`/`center`) still one word away in
    `essay.en.svx`.
13. Analytics: swap GA4 for a cookieless counter before the site is public, and
    add scroll-depth events — no consent banner in front of the opening. See the
    deploy section above.
14. `notes/prose.md` §4–16 have never been edited by the owner — he worked
    through §3 and stopped. The ending is untouched.
15. Coin photograph rights: asked the mint for permission and sponsorship,
    awaiting reply. Settle before the site is listed publicly.
16. Owner reported cow plates overlapping on scroll-back once; NOT reproducible
    (forward, reverse, fast fling, reload-parked all show exactly one plate).
    Switching is now deterministic by construction. If it recurs, get the
    browser and the position.

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

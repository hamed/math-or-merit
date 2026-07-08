# MEMORY.md — durable, agent-agnostic memory for this repo

Any coding agent (Cursor, Cline, Windsurf, opencode, Claude Code, …) should read
this alongside `AGENTS.md` (architecture law) and `CONTEXT.md` (current state
snapshot). This file holds what outlives any single session: how the owner works,
decisions that must not be reopened, and lessons already paid for. Append; don't
rewrite history. Date every entry.

## How the owner (Hamed) works

- Delegates whole features; wants a **finished, verified product**, not a plan or
  a half-build. Verify end-to-end (run it, screenshot it, look at it) before
  reporting done.
- Storyboards and reviews are **soft guidelines aiming at polish** — you may
  challenge or improve on them, but say so before diverging.
- Flag any prose/content changes you make; the essay's voice is his. The full
  language pass is his, explicitly deferred ("text is boring, less is better;
  we will do that later").
- Aesthetic: clean, frameless, minimal text on screen, text and visuals blend on
  the paper background. When in doubt, remove chrome.
- Drops input in `inbox/` (any format). Process per the AGENTS.md inbox workflow:
  transcribe/promote to `notes/`, then remove the item.

## Decisions locked (2026-07-06) — do not relitigate

- **GSAP** (core + ScrollTrigger + MorphSVG): adopted, owner-confirmed. Quarantined
  behind `src/lib/widgets/stage/gsap.ts`; enforced by `src/lib/boundaries.test.ts`.
- **Histogram AND Gini**, in sequence — Gini built from the reader's own room,
  then reused as the number everywhere (game meters, phase map, sandbox).
- **Narrative runs are unseeded** — every run different; concentration claims stay
  distributional, never per-run. Curated seeds remain only as fallbacks/tests.
- **Two-clocks rule** (ADR-013): authored beats scrub and reverse with scroll;
  stochastic runs re-run, never scrub. Structural, not stylistic.
- **Agent traits are display-only** (pastel fill + independent stroke + shape) and
  must never enter the simulation — that inertness IS the essay's argument.
- Ship target for the 2026-07 pass: full buildable version; deployment separate.

## Claim discipline (standing, not just this build)

- Measured vs fitted: the phase map's contour is MEASURED; its smooth curve is
  FITTED (τ* ≈ 0.37·β², memo in `notes/research/interventions.md`). Never write
  "theoretical", "law", or "phase transition" in essay copy.
- Manual-vs-structural levy comparison: **unclaimed** — gate open.
- Sandbox interest + progressive designer: toys; no policy claims
  (`notes/research/extensions.md`).
- The misattributed Musk hustle quote stays out (D1, `notes/draft-decisions.md`).

## Lessons paid for (bugs/costs already incurred — don't repay)

- GSAP parses an SVG `transform="translate(x y)"` attribute into its x/y channels,
  so tweened x/y are **absolute**: `fromTo(el, {y:-14},{y:0})` teleports the
  element to the viewBox top. Always write `{y: POS.y - 14} → {y: POS.y}`.
- Don't center SVG/HTML with CSS `transform: translate(-50%,-50%)` if GSAP will
  tween transforms — it clobbers. Use `xPercent/yPercent: -50` via GSAP.
- Set `transformOrigin: '50% 50%'` explicitly in SVG tweens; CSS `transform-box`
  isn't reliably honored.
- Never hide scene elements with CSS for their initial state — hide via
  `fromTo(... immediateRender)` so static markup keeps the content.
- All GSAP creation inside `gsap.context()` in mount, cleanup via `ctx.revert()`;
  only the sequencer (PinScene) owns triggers — scenes just fill a passed timeline.
- Svelte transitions and scroll-scrubbing fight (wall-clock vs scroll-clock):
  captions/opacity must be tweens inside the master timeline.
- Six saturated hues can't pass strict all-pairs CVD on light paper; the shipped
  stroke set is floor-band (worst ΔE 10.3) and legal ONLY because shape is a
  secondary encoding. Revalidate (`dataviz` checks) before touching the palette;
  gold is reserved for money.
- No-JS = blank page (Vite SPA, no SSR). Reduced-motion mode is the real a11y
  fallback; keep it working (PinScene: no pin, IntersectionObserver seeks).
- Verification recipe that works headless: `npm run preview -- --port 4173`, then
  puppeteer-core (installed in a scratch dir, NOT the repo) with
  `executablePath: /usr/bin/google-chrome`, `--no-sandbox`. Pinned sections wrap
  in `.pin-spacer`; scroll to `spacer.top + fraction·(spacer.height − viewport)`.
  Screenshot beats and **look** at them; console-error capture on every sweep.
- `/tmp` scratch state dies on reboot/crash — reinstall scratch deps, never rely
  on it across sessions.
- (2026-07-08) Never mix `svgOrigin` scaling and x/y translation on the SAME
  SVG element across tweens — gsap re-derives the transform and the element
  teleports. Nest two groups: outer translates, inner scales/mirrors. Also
  never combine `scale` and `scaleX` in one vars object (shorthand overwrites).
- 100k trades ≈ 1 ms: prefer computing simulation grids live in-page (chunked
  under a frame budget, session-cached) over precomputed JSON pipelines.

## Standing verification bar

`npm test` (all green, includes boundary + curated-seed guards) and
`npm run build` (warning-free) before every commit; small reviewable commits, one
concern each; repo shippable at every commit.

## Local, uncommitted, not yours

`.clinerules/ .cursor/ .github/ .opencode/ .windsurf/ install.sh` and the owner's
`AGENTS.md` style edits — his multi-agent setup. Leave them alone.

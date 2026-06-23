# Presentation spike — choosing the stage engine

**Status:** Planned, not built. A throwaway spike to decide *how* to present the essay
(the "stage / two-stream" model from `draft-decisions.md` D8), before committing any
dependency or architecture. Nothing here ships; nothing here is fixed yet.

**Decision it serves:** which engine drives the authored "movie + subtitle" presentation —
a persistent canvas that morphs in place while short text chunks come and go — and how that
engine coexists with the interactive simulation and games.

**Background:** [`draft-decisions.md`](draft-decisions.md) D8 (stage model, deliberately
unfixed); ADR-004 and ADR-005 amendments (the seam is flagged, not opened); ADR-002
(SimEngine boundary — headless, framework-agnostic); ADR-011 (sandbox/mini-game boundary,
Deferred).

---

## Don't reinvent the wheel — what already exists

This is an established genre (scrollytelling / cinematic-scroll explorable). The vision
decomposes into existing pieces:

| Need | Existing tool |
|---|---|
| Shared **clock / sequence** | [Scrollama](https://github.com/russellsamora/scrollama) (~2kb, IntersectionObserver, step-based) *or* [GSAP ScrollTrigger](https://gsap.com/scroll/) (scrubbable timeline, pinning) |
| **Text in/out, nice transitions** | Svelte built-in `transition:` / `crossfade` — zero extra dep |
| **Illustration morph** (cow → circle → person) | GSAP **MorphSVG** (native path morph) *or* **Flubber** (path interpolation, no GSAP) |
| **Minimal big text + sticky/overlay visual** | the sticky-graphic scrollytelling pattern (Scrollama's headline feature) / pinned ScrollTrigger section |
| Smooth scroll feel (optional) | Lenis |

Key recent fact: [GSAP went 100% free in April 2025](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)
(Webflow owns it), including the formerly-paid MorphSVG, SplitText, ScrollTrigger. So the
single tool that does *timeline + shape morph + text reveal* is now no-cost.

**Avoid for this stack:** Idyll and [Basement Studio scrollytelling](https://github.com/basementstudio/scrollytelling)
are React+GSAP — they fight Svelte 5 + mdsvex (ADR-004). Borrow ideas, don't adopt.

**Reference works to study the *feel* (not libraries):** Bartosz Ciechanowski
(ciechanow.ski), The Pudding (who make Scrollama), Nicky Case (ncase.me), Apple product
pages (cinematic minimal-text + sticky morph), Distill.pub.

---

## The two approaches under test

### A — Svelte-native (lightest, in-grain)
- **Clock:** Scrollama (step + progress).
- **Text:** Svelte built-in transitions (no extra dep).
- **Canvas:** a Svelte `<Stage>` component subscribing to the current step; sticky/overlay.
- **Morph:** Flubber interpolates cow `d` → circle `d`, driven by `tweened` / scroll progress.
- **Fallback:** no-JS / reduced-motion → prose + static cow image; degrades cleanly.
- **Character:** declarative, reactive, minimal deps, accessible by default; you wire morph
  progress yourself.

### B — GSAP-centric (cinematic, one toolchain)
- **Clock:** GSAP ScrollTrigger (scrubs a timeline by scroll; pins the canvas).
- **Morph:** MorphSVG cow → circle natively; vacuum squeeze = scale/skew; uphill = position tween.
- **Text:** plain DOM + GSAP, or SplitText for per-word reveals.
- **Quarantine:** all imperative GSAP lives inside one `<Stage>` widget behind
  mount/config/cleanup — never leaks to the engine (ADR-005).
- **Fallback:** must be built deliberately (reduced-motion → jump-to-state; no-JS → static).
- **Character:** heavier dep, imperative; but morph + scrub + text in one tool, cow→circle
  near one-liner.

Both shells render the **same content** — the beats-1–3 prose slice and its `CANVAS →` cues
from `src/content/essay.en.svx` — so the comparison is presentation-only, not content.

---

## Scope — two phases

### Phase 1 — the joke morph (beats 1–3)
Opening headline → "Merit or Math" → labor / answer-cloud → the joke (cow → sphere → vacuum
→ uphill → "the problem was the weight"). **Pure authored morph, no simulation.** Tests the
*movie*: morph quality, scroll feel, text transitions, fallback.

### Phase 2 — the sim handoff (beat 11, "Now run it")
Scroll arrives at a beat whose stage occupant is the **interactive simulation**. Tests the
*handoff*, which Phase 1 does not exercise:
- scroll → sim takeover (pin the section, yield control, resume after);
- **scroll-vs-gesture conflict** (drag/tap inside a scrolling page, esp. mobile) — the real
  risk; needs an explicit "you are now playing" enter/exit mode;
- the two-clock split: authored beats are scroll-reversible; a stochastic run is **not**
  (re-seed/replay, never scrub).

Tilt to watch: interactive-heavy sections slightly favor **A** (pin-and-yield is simple;
GSAP's scrub value goes unused there); morph sections favor **B**. The answer may be hybrid.

---

## Assets

Functional morph is **cow path → circle**, so we need: a **single-path cow SVG** (side
profile morphs best), a circle (the "sphere"), and later a slope + square-cow / rough-cow
variants for the uphill gag. A pre-made "spherical cow" drawing is optional flavor for the
end pose, not required for the morph.

Sourcing, cheapest-license-first: SVG Repo, openclipart.org (CC0/public domain), then
Wikimedia (check license), Noun Project (attribution). **Provenance discipline (AGENTS.md
inbox workflow):** assets land in `inbox/` first with a license/provenance note, treated as
untrusted until reviewed — not dropped into the build.

---

## What we judge
- **Morph quality** — does cow → sphere feel magic or janky?
- **Scroll feel** — scrubbed/cinematic (B) vs stepped (A).
- **Reversibility** scrolling back up (authored only; never the sim).
- **Dep weight & fit** with Svelte 5 / mdsvex / dependency discipline (AGENTS.md).
- **Accessibility** — reduced-motion + no-JS readability.
- **Sim coexistence** (Phase 2) — clean pin-and-yield; gesture handling.
- **Effort** to extend across the whole essay.

---

## Sim / sandbox coexistence (already designed for)
- **The SimEngine boundary (ADR-002)** is headless and Svelte-free — it knows nothing about
  scroll/stage/Scrollama/GSAP. **The presentation choice cannot touch the simulation.**
- **Two clocks meet at the stage** (D8 "the break"): authored = scroll clock, reversible;
  sim/games = reader's clock (run/seed/drag/tap), not scroll-reversible. The stage pins and
  yields; it never scrubs a stochastic run.
- **Sandbox & games are a separate surface.** The essay embeds *constrained* sim instances
  (beat 19's tap-to-tax); the full sandbox and progressive-tax designer are their own
  page/mode — same engine, different harness (ADR-011, Deferred). Scrollytelling does not
  host the whole sandbox.

---

## Logistics
Throwaway and isolated — out-of-the-way pages (e.g. `proto/joke-scrollama`,
`proto/joke-gsap`), **off the shipping path**; deps added as a spike we can rip out. Same
prose slice imported into both.

## Recommendation (lean, pre-spike)
Expectation: **B feels more cinematic and nails the morph with less fighting; A is cleaner,
lighter, more accessible.** The spike decides whether B's polish justifies the dep and the
imperative code, or whether A is already enough — and Phase 2 may push toward a hybrid
(A-style pin-and-yield around interactive beats, richer morph where it earns it). Build one
shell first (A, in-grain) to react to, then the other.

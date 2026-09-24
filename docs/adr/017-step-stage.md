# ADR-017 — The step stage: a third section kind, stepped in time

Date: 2026-09-24
Status: **PROPOSED — awaiting the owner. Not accepted. Nothing is built.**
Amends ADR-013 (adds a section kind). Serves ADR-015. Source: dialogue brief v3, A1–A3.

## Context

ADR-013 gave the essay two section kinds: **scrub scenes** (a `PinScene` scrubs
one GSAP timeline with scroll, reversible by construction) and **yield
sections** (interactive widgets on the reader's clock, unpinned).

The dialogue brief asks one stage to carry the title, the crowd, the two
protagonists, their introductions, the reader making them equal, the first
game, the challenge, and the room filling — Scenes 1–14. That stretch needs
three things the two existing kinds cannot give it together:

1. **It waits for the reader.** Scene 3 holds until both circles are clicked,
   Scene 9 until the reader reaches 8 and 8. A scrubbed timeline cannot wait
   for a click; a yield section can, but is not a stage.
2. **It is one continuous subject.** ADR-015: a subject that persists across
   beats belongs to one scene, as one DOM node. Blue and Red are that subject
   from the title to the ring.
3. **It speaks.** Dialogue bubbles follow their speaker, one at a time, and must
   shape Farsi correctly (A2).

The branch `feat/circle-overture` tried the other route and shows its cost. It
split the same stretch into a timed `PinScene`, a yield widget and a scrubbed
`PinScene`, and carried the two people across the two seams **by value** (a
module store, like `runLog`). It works, and every seam is a cut the reader
sees — exactly the swap ADR-015 was written to prevent.

The scrub machinery also carries costs that exist only because of scrub:
`restAt`, the caption timing constants (`TEXT_LEAD`, `TEXT_GAP`, `TEXT_FADE`,
`TEXT_EXIT`), per-beat `artBottom`, parking mid-tween, and the wall-clock versus
scroll-clock fights every ambient animation has had to route around.

## Decision (proposed)

Add a third section kind: the **step stage**.

### Steps are data

A stage is a list of steps. The player never names a scene and never branches
on one (ADR-005, ADR-013's guard, verbatim).

```ts
interface StepSpec {
  readonly id: string;                 // unique within the stage; also the restore key
  readonly lines?: readonly LineRef[]; // who says what — ids into content, never literal strings
  readonly action?: string;            // a label the stage's own build knows how to play
  readonly wait: Wait;
}

type Wait =
  | { readonly kind: 'reader' }                    // default: next input advances
  | { readonly kind: 'auto'; readonly ms: number } // teletype, reels, crowd
  | { readonly kind: 'action' };                   // hold until the stage reports done
```

A stage module exports `STEPS` and implements `play(step)` and `settle(step)` —
play the step's action in time; jump to its authored end state. That is the
whole contract. Holds (`action`) are released by the stage calling `done()`.

### One input rule

- **Next:** click or tap on empty stage, Space, → or ↓, or one wheel/swipe
  gesture (debounced to one step, reusing `WHEEL_GESTURE_REST_MS`).
- **Back:** Shift+Space, ← or ↑, or a backward gesture. Back goes to the
  previous step's **end state** (`settle`), never to the middle of a tween.
- **Clicks on controls never advance.** Keys are ignored while a control has
  focus (`keyIsClaimed`, as `PinScene` already does).

### Scroll

The page scrolls normally until the stage fills the viewport. From then on,
gestures are steps. Before the first step and after the last, gestures go back
to the page. Nothing else captures scroll.

This is the R31 trap class, and it is the main risk of the proposal: a stage
that owns gestures is precisely a place a reader could fail to leave. So the
boundary rule is not advisory — the wheel-stall test must reach both ends of
the essay through the stage in both directions, and a hold must never block
leaving the stage backwards.

### Holds are one-way

Once a hold is released, stepping back shows the authored end state (8 and 8),
not the reader's own moves. The step index is remembered for reloads, like the
existing scroll restore.

### Time, not scrub

Every action is a short tween played in time. Nothing is scrubbed. The ambient
layer (the protagonists breathing, Scene 3's call-outs) runs on the same clock
in a nested inner group, never on an element the step tweens also move — the
lesson MEMORY.md already records.

### Reduced motion

Tweens become cuts: `settle` instead of `play`. Auto steps keep their order and
advance on input rather than on a timer. No typewriter, no bounce, no wiggle.

### Where it lives

`src/lib/widgets/stage/StepStage.svelte` (the player) beside `PinScene`, under
the same GSAP quarantine: `stage/gsap.ts` stays the only file importing
`gsap`. `PinScene` is untouched and keeps serving the cow until — and only if —
the cow moves over (see Consequences).

## Sub-decision the owner must make: where the words live (A2)

A2 is decided: every word is content, lines with live values are full-sentence
messages with named variables and plurals, numbers go through
`Intl.NumberFormat`. **None of that infrastructure exists today.** Paraglide and
inlang are named in `AGENTS.md` but not installed; `index.html` has
`lang="en"` and no `dir`; nothing reads a locale.

Two ways to meet A2, both preserving ADR-013's "the document is the manifest":

1. **Lines inline in `essay.en.svx`** as `<Line step="scene-4" who="blue">`
   children of the stage — the same shape as today's `<Caption beat={n}>`, so
   `essay.fa.svx` translates them in place. Live-value and branching lines
   (`{blue} coins`, the bet, the reveal) go through a message module.
2. **All dialogue in a per-locale message file**, the svx holding only step ids.

Recommendation: **(1)**, with a small in-house message module (typed messages
per locale, `Intl.PluralRules`, `Intl.NumberFormat`, no dependency) shaped so
that moving to Paraglide later is mechanical. It keeps the owner's words in the
document where he can read them in order, and adds no dependency before the
first non-English locale needs one. **Installing Paraglide now is the
alternative** — `AGENTS.md` already sanctions it — and costs a build-time
compiler step for one language.

## Consequences

- **One clock for the story.** The pair is one DOM node from the title to the
  ring (ADR-015 by construction), and the by-value handoffs go.
- **Deletable once it lands, each to be proposed with its cost:** for the
  story, `restAt`, the caption timing constants and per-beat `artBottom`; the
  merged `PersonTradeScene` (its reduction becomes branch B2, its trade moves
  into the stage); on `feat/circle-overture`, `TwoPeople.svelte`,
  `handoff.svelte.ts` and `TRADE_BEATS`.
- **If the cow moves over too,** scrub mode — `PinScene`, `Caption`, the `navs`
  registry's scroll-position half — can be retired, leaving one kind of authored
  section. That is a second decision, taken after this one has shipped.
- **Reverse is no longer free.** Scrub gave exact reverse by construction; a
  step stage gives it by `settle`, which each stage must implement. `settle` is
  unit-testable per step without a DOM, which scrub never was.
- **No-JS** renders the dialogue as text in reading order (the `<Line>`
  children are real text), as captions are today.

## Alternatives rejected

- **Keep scrub for the story.** It cannot hold for a click, and the two-person
  act is built on holds.
- **Three sections joined by value** (`feat/circle-overture`'s route). Works;
  every seam is visible; ADR-015 exists because of that failure mode.
- **Teach `PinScene` to hold.** Puts a second clock and reader-input rules into
  the scrub sequencer, and a scrubbed timeline parked on a hold still has to
  decide what scrolling means while it waits. Two concepts in one engine.

## Acceptance (before this ADR moves to Accepted)

Wheel-stall test through the stage both ways; reduced motion; keyboard only;
390 px; reverse; restore on reload; a hold never blocks leaving backwards.

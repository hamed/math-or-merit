# ADR-018 — One stage for the whole essay: acts on a persistent room

Date: 2026-09-26
Status: **ACCEPTED 2026-09-26 by the owner** (proposed the same day; iteration-2 brief, Part 2).
Amends ADR-013 (yield sections become acts). Extends ADR-017 (the step stage
carries the whole essay, not only the story). Serves ADR-015. Withdraws the
ADR-006 amendment (see "Sides").

## Context

The owner's walkthrough of the v3 build (brief `merit-or-math-iteration-2.md`,
2026-09-25, `[41:24] [51:26] [66:37]`):

> Blue and Red come in at the start and never leave. … Stop creating new rooms
> and new widgets further down the page. Each concept is built on the room the
> reader is already watching, "as if drawn by hand on the spot."

Today the story (Scenes 1–14) is one step stage (ADR-017), and everything after
it is ADR-013's second kind: **yield sections**, each its own full-viewport
widget with its own room — `Prediction`, `RevealRun`, `DistributionStage`,
`GiniStage`, `EffectiveParticipantsStage`, `CrowdRun`, `TimeLapse`, `StakeDial`,
`TaxGame`, `LevyLesson`, `MatchedRooms`, `PhaseDiagram`, `Sandbox` — separated
by prose. Every one of them starts a new room of strangers. The reader loses
Blue and Red at the end of Scene 14 and never sees them again.

ADR-017 already says why that is the wrong shape for a continuous subject: every
seam is a cut the reader sees (ADR-015). The brief asks for the same fix, applied
to the back half.

## Decision (proposed)

### One stage, many acts

The essay becomes **one step stage** whose steps are grouped into **acts**. An
act is data:

```ts
interface ActSpec {
  readonly id: string;           // also the chapter id and the URL fragment
  readonly chapter: string;      // message key for the index label
  readonly steps: readonly ActStep[];
  /** What the room looks like when a reader deep-links here (no prior run). */
  readonly start: RoomPose;
}

interface ActStep extends StepSpec {   // ADR-017's StepSpec: id, lines, wait
  readonly room?: RoomPose;            // free · piles · log ruler · two rooms · four people · zoom
  readonly panels?: PanelChange;       // charts and thumbnails in or out
  readonly controls?: ControlRef;      // controls placed inside a speaker's bubble
  readonly cards?: readonly string[];  // concept cards dropped into the stack
}
```

`StepStage` stays what ADR-017 made it: it never names an act, a scene or a
widget. Acts are appended to one list; adding a concept is adding an act (data,
lines, a card), never editing the player — the ADR-005 guard, verbatim.

### What the stage holds

Five layers, each owned by one module:

1. **The room** — one `SandboxWorld` + `RoomCanvas`, created once. Room poses
   are the room module's own closed vocabulary; acts name them, the room
   implements them.
2. **Blue and Red** — agents 0 and 1 of that room from Scene 14 to the sandbox,
   in their costumes, never removed.
3. **The bubble layer** — HTML over the stage (A2), holding lines and the
   reader's choices as links inside the speaker's bubble.
4. **The side rail** — thumbnails of concepts already built (histogram, Gini,
   effective participants).
5. **The card stack** — concept cards; the first is the rule card, which reads
   the rule from the live `SimConfig`, never from typed text.

### Widgets become act modules

The existing widgets' interiors (layout, sorting, Lorenz drawing, the tax game's
state machine) move behind the stage's scene contract — `play(step)`,
`settle(step)`, `nudge` — which is ADR-005's mount / config / events / cleanup
with the room passed in instead of created. What a widget **drew** moves into a
room pose or a panel; what it **decided** stays in `sim/` untouched.

### The two clocks survive inside the stage

ADR-013's rule holds: stochastic runs **re-run, never scrub**. A run is a step
whose wait is its own completion (a hold released by the run), and stepping back
over it settles to the run's recorded end, never replays it backwards.

### Chapters, fragments, restore

Each act registers a chapter. `#gini` seeks the stage to that act's first step
and applies its `start` pose. The chapter index lists acts and stays reachable
whenever the stage waits on the reader (already shipped with the navigation
fix, 2026-09-26). Restore remembers act and step.

### Leaving the stage

With nothing after the stage but the colophon, "gestures go back to the page past
either end" no longer offers a way out mid-essay. The index is that way out, and
the R31 acceptance stays non-negotiable: the wheel/trackpad/key/touch sweep must
reach both ends in both directions.

### Accessibility

Every act also renders its lines, in order, as a visually hidden transcript, so a
screen reader reads the essay as a document rather than a stream of live-region
announcements. Reduced motion: tweens become cuts, runs jump to their end.

### Sides

Confirmed by the owner (2026-09-26): the title is "Merit or Math?" — "the left
should come first, because English is left to right; the common sense is
merit, the question is math" — with each circle under the word it believes in.
The ADR-006 amendment (physical sides) is withdrawn; the stage mirrors in RTL
like everything else.

## Migration: act by act, shippable at every step

The stage grows at its end. Each phase appends acts, then deletes the yield
section(s) and prose those acts replace, and lists what each deletion cost.
Until an act ships, its old section stays below the stage exactly as today.
Order (brief Part 6): the guess and the run → histogram, Gini, effective
participants → the levy acts → the sandbox.

## Consequences

- **The essay stops being a scrolling document.** Progress is the index, not the
  scrollbar. This is the real cost, and the reason the index and the sweep are
  acceptance items rather than polish.
- **One room instead of thirteen** — less memory and fewer canvases, but the room
  module grows a vocabulary of poses, and it must stay a vocabulary (named,
  tested poses), not a pile of special cases.
- **Deep links get cheaper to break.** Each act's `start` pose must stand alone
  without the reader's run; a test settles every act from its `start` with no
  history.
- **Deletable as acts land**, each proposed with its cost: the yield sections
  listed above, their prose, `Prediction` as a page widget, `WinnerStory` (a
  duplicate of `NewsFlash`), and — if the cow ever moves in — `PinScene` and
  `Caption`.

## Alternatives

- **Keep yield sections, put Blue and Red into each widget** (by value, like
  `runLog`). Cheap, and every section is still a new room: the seam the owner
  asked to remove.
- **One step stage per chapter, joined by value.** `feat/circle-overture`'s
  route; ADR-017 rejected it for the story, and the reason is the same here.
- **Leave the back half as it is and only restyle it.** Does not answer
  "one stage, one room".

## Acceptance, per phase

The sweep through the whole stage both ways
(mouse, trackpad-shaped wheel, keys, 390 px touch); reduced motion; keyboard
only; every act settles from its `start` with no history; restore on reload;
fragments land on their act.

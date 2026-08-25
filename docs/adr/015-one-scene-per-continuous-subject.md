# ADR-015 — A continuous visual subject lives in ONE PinScene

Date: 2026-08-25
Status: accepted
Supersedes nothing. Constrains ADR-013.

## Context

The essay carries one object across long stretches of argument: the circle. The
cow becomes it, the person reduces onto it, it becomes coins, it trades, it joins
the room. That continuity is the argument, not decoration — a person *is* a
number, and the number that traded is the same number the room is made of.

The person's reduction and the first trade were built as two `PinScene` sections
that drew the same circle at the same viewBox point. That is not enough. Pinned
sections move: the first unpins and scrolls off the top while the next scrolls up
from the bottom. The reader sees the circle exit upward and an identical circle
rise from below.

Three attempts failed before the cause was named, and all three failed the same
way — they matched *geometry* across the seam:

1. equalise stage widths, so the circle is the same size on both sides;
2. equalise the height cap too, so both stages scale at the same px-per-unit;
3. compensate the viewBox offset exactly ((300 − 280)/2 = 10 units).

By the third attempt the circle's centre and width were pixel-identical across
the seam at four viewport sizes. The swap was still obvious, because the sections
themselves were moving. No geometry fixes that.

## Decision

**If a visual subject must persist across beats, those beats belong to one
`PinScene`, and the subject must be one DOM node.**

Not "the same shape drawn twice with matching coordinates". The same element.

`PersonTradeScene` is the first application: twelve beats covering the reduction
and the first trade, with one `<path>` that is the person's leftover circle, then
trader A, then a member of the ring.

## Consequences

- A merged scene is larger than either half. That is accepted. The alternative is
  a seam the reader notices and learns nothing from, and scene size is a cost we
  can pay: scenes are deep modules behind `attach(BEATS, build)`, and the
  sequencer still never branches on scene names (ADR-005 holds).
- Section boundaries become an authoring decision with a visual consequence, not
  just a document convenience. Put a boundary where the subject genuinely
  changes — the cow scene ends by pushing into the ball and the next opens on a
  different subject entirely, so that seam is free.
- Merged scenes may mix viewBox conventions. `PersonTradeScene` is 480×300, the
  trade layout's box; the 480:280 person plates sit in a rect inset by 10, and
  every person-side constant is derived from that inset rather than restated.
- Beat labels must stay unique across a merged scene, since they are timeline
  labels. They already were.

## Alternatives rejected

- **Matching geometry across two sections.** Tried three times, verified to zero
  pixel delta, still visibly wrong.
- **Teaching `PinScene` to concatenate several scene children.** This would put
  composition into the sequencer, and the two scenes would still render two
  separate `<svg>` roots — so still two circles. The contract stays one
  `attach` per scene.

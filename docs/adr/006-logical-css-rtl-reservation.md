# 006 — Logical CSS properties only (RTL reservation)

## Status
Accepted

## Context
Persian is a likely future locale, and it is right-to-left. Retrofitting RTL into a codebase written with physical CSS properties (`margin-left`, `text-align: left`) is a pervasive rewrite. We want the reservation to cost nothing now and activate with a config flip later.

## Decision
Use logical CSS properties exclusively: `margin-inline-start` not `margin-left`, `text-align: start` not `left`, `padding-inline`, etc. Direction is driven by a single `dir` attribute off the active locale. Vazirmatn sits in the font stack from the start.

## Consequences
- RTL is a zero-cost reservation: when an RTL locale lands, it's a config flip, not a layout rewrite.
- A second LTR language is nearly free; the first RTL one (Persian) cashes in this reservation and is the real work — but the layout won't be part of that work.
- Cost: contributors must use logical properties consistently. This is the kind of intent worth encoding as a lint rule so it's checked by machine, not by review.

## Amendment (2026-09-24) — one deliberate physical exception

The title words and the two protagonists keep their PHYSICAL sides in every
locale, Farsi included: MATH and Red on the left, MERIT and Blue on the right
(D19, ADR-017 A2). The left/right placement is itself content — a faint
political association that is spatial, not directional — so mirroring it in a
right-to-left locale would change what the page says.

Everything else stays logical and mirrors with `dir`. The exception is confined
to where those two things are drawn and to what is anchored to them (a speech
bubble is placed by its speaker's physical position; the words inside it follow
the document's direction). New code that uses `left`/`right` must be one of
those, and say so in a comment.

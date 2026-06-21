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

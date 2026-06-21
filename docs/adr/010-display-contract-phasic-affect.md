# 010 — Display contract and phasic affect

## Status
Proposed

## Context
The per-agent visual could encode standing wealth as a permanent state ("poor = sad, rich = bright"). That bakes *social category* into identity — exactly the framing a wealth-condensation argument must avoid — and it misrepresents how affect actually works. The display must also never feed back into game or society (ADR 007).

## Decision
The display is **semi-autonomous and pure output.** The game emits *per-agent economic outcomes* (lost / gained / taxed, and by how much); the display decides how to show them and nothing flows back up.

- Affect is **phasic, not tonic**: a baseline that slowly tracks standing position, plus a transient that spikes on each event and decays back toward baseline (a leaky integrator).
- Exactly **one place** knows what a wealth-change *means* for the display (loss = negative-valence / high-arousal, gain = positive, tax = its own flavour). Re-framing the essay's rhetoric is a change to that one seam and nothing else.
- The two-axis (valence × arousal) model is chosen as **fit-for-our-data and parameter-minimal, not scientific consensus** — state that plainly rather than claiming the science certified it.

## Consequences
- The room's asymmetry emerges from the *event stream*, not from pre-labelled faces — condensation is watched, not asserted.
- For the current placeholder circle, valence ≈ colour and arousal ≈ size/jitter; the model survives with no face at all.
- The economy never hears the word "face": its vocabulary stays economic. Whether the economy *emits* events or the display *diffs* state is left open.
- Mounted through the widget contract (ADR 005); the meaning→geometry seam is the display's licensed internal complexity.

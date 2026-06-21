# 010 - Event-reactive display and affect

## Status
Deferred

This record is not an active architecture constraint. The full affect, animation, and
human-drawn aesthetic ideas live in [`notes/ideas.md`](../../notes/ideas.md).

## Context
Displayed individuals may blink, breathe, look around, and otherwise animate independently
of the economy. Economic gains, losses, or taxes may temporarily perturb that baseline.

A candidate model uses valence and arousal with transient responses that decay through a
leaky integrator. This is an expressive visual language, not yet a scientific model of
human emotion. Dimensional and discrete emotion models, event mappings, and facial
interpretations require research.

## Candidate direction
Keep stable visual identity, independent animation, economic interpretation, and rendered
geometry conceptually separable.

Potential behavior includes:

- a neutral or slowly changing baseline;
- short gain, loss, or tax impulses;
- overlapping or saturating reactions;
- decay back toward baseline;
- one mapping from economic meaning to an abstract display state;
- another mapping from display state to circle or face geometry.

The economy should use economic vocabulary rather than visual vocabulary. This does not
yet decide whether it emits outcome data or presentation derives changes from snapshots.

## Open questions
- Does standing wealth affect baseline appearance at all?
- Are valence and arousal the right dimensions?
- How should gain, loss, tax, amount, and repetition map to a response?
- Must every trade be visible, or should events be sampled or aggregated?
- Does the simulation emit outcomes or does presentation diff state?
- How can expressions remain elegant, legible, and free of social stereotypes?

## Revisit when
The first animated agent needs to react to more than a single state snapshot.

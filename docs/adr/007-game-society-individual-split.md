# 007 - Game / society / individual split

## Status
Deferred

This record is not an active architecture constraint. It preserves one candidate split
from the project brainstorm. The lossless exploration, including competing formulations,
lives in [`notes/ideas.md`](../../notes/ideas.md).

## Context
The project may compare multiple ways of selecting pairs while holding a pairwise
exchange rule fixed. It may also give each displayed individual independent animation
and transient reactions to economic events.

An early vocabulary called these concerns **game**, **society**, and **individual**. A
different vocabulary or boundary may fit the implementation better. The scientific claim
that changing topology preserves condensation is also an open question, not an
architectural premise.

## Candidate direction
Keep these concerns distinguishable:

- the pairwise interaction rule determines what happens after two agents meet;
- an encounter mechanism determines which agents meet;
- presentation determines how state and outcomes look and move.

The whole simulation may own fields such as wealth, position, and identity while giving
each subsystem access only to the fields it needs. In particular, the transaction rule
should not accidentally depend on visual appearance or a specific encounter mechanism.

This is a cohesion goal, not yet a commitment to three interfaces or modules.

## Open questions
- Are game / society / individual the clearest names?
- Is selecting a pair sufficient, or must a spatial mechanism also advance a world?
- Should presentation receive economic outcomes or infer them from state changes?
- Are the physical and economic scenes two views, two instances, or different models?
- Which boundary becomes useful only after a second encounter mechanism exists?

## Revisit when
A second pairing mechanism, spatial experiment, or event-reactive display is ready to be
implemented.

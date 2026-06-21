# Encounter topology

## Question

What changes when the fair transaction rule is fixed but allowed pairs are restricted?

## Model and controls

- The static research model chooses uniformly from a fixed, unique edge list.
- Ring, 2D torus, and ring-backed connected random graphs all begin connected and equal.
- The pairwise transfer is the same internal function used by the baseline engine.
- Results must separate finite-time inequality, eventual local concentration, and global
  concentration.

The research runner captures wealth metrics, strict local-rich counts, neighbor-wealth
correlation, per-edge encounter counts, encounter coverage, and effective encountered
edges. Scaling over graph degree remains the next confirmatory protocol.

## Literature reconciliation

[Bustos-Guajardo and Moukarzel](https://arxiv.org/abs/1208.4409) numerically study rings,
lattices, and random graphs with a broader win-probability parameter. Their unstable
network phase produces multiple locally rich agents. The later
[local-condensation result](https://arxiv.org/abs/2406.10978) gives a direct theorem for
restricted Yard-Sale interactions. Exact assumptions must accompany either result.

## Current evidence

Protocol version 1 shows materially different finite-time concentration, local-rich
counts, and negative neighbor correlations across the three graphs. It is not a
mixing-time study, and the checkpoint is not an asymptotic state. Moving collisions are a
time-varying encounter process and remain outside this result.

## Verdict

**Defer.** The static graph model is ready for confirmatory scaling, but no topology
sentence should enter the essay until degree controls and longer checkpoints are
summarized.

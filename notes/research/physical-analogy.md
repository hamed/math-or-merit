# Physical analogy

## Equation-level comparison

| Property | Random reshuffling control | Yard-Sale baseline |
| --- | --- | --- |
| Pair selection | Uniform distinct pair | Uniform distinct pair |
| Update | Randomly split the pair's combined wealth | Transfer a fraction of the poorer wealth |
| Conserved quantity | Total wealth | Total wealth |
| Non-negative boundary | Preserved | Preserved |
| Literature claim | Exponential equilibrium under stated assumptions | Condensation under stated assumptions |

The reshuffling implementation follows the closed random-exchange model in
[Drăgulescu and Yakovenko](https://arxiv.org/abs/cond-mat/0001432). Protocol version 1
finds a broad non-condensed distribution after the same number of trades for which the
Yard-Sale runs are highly concentrated. A formal distribution-fit replication remains.

## Language decisions

- **Rejected:** Yard-Sale exchange "breaks conservation."
- **Metaphor:** people as particles sharing a pairwise stochastic structure.
- **Deferred:** identical equations, universality, shared phase class, and
  Bose-Einstein-style condensation.
- **Allowed:** conservation does not determine the distribution; the exchange rule
  matters.

## Network-condensation lead

The earlier Bianconi-Marsili note joined several distinct results too quickly:

- [Bianconi and Barabasi (2001)](https://arxiv.org/abs/cond-mat/0011224) map a growing
  fitness network to a Bose gas and identify a network condensation in which one node
  receives a macroscopic fraction of links.
- [Seyed-allaei, Bianconi, and Marsili (2005)](https://arxiv.org/abs/cond-mat/0505588)
  study scale-free graphs with degree exponent below two. That is a graph-ensemble result,
  not a Yard-Sale wealth model and not the source of the Bose-gas mapping.

Neither paper establishes equation-level equivalence with the current asset-exchange
process. They remain adjacent examples of mathematical condensation, not support for
"wealth obeys Bose-Einstein statistics" or a shared universality class.

## Verdict

**Include after one confirmatory fit.** The equation table is sound now; the visual
physical comparison should wait for an exponential goodness-of-fit check and careful
wording that the two models are contrasts, not identical systems.

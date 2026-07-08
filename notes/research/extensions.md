# Additional mechanism research

Research leads for mechanisms that are explicitly outside the conserving fair baseline.
None is an interchangeable slider; each changes the model and needs its own controls.

## Subsistence or participation floor

**Status:** Mechanism undefined.

The notes currently mix at least three models: remove agents below a threshold, reduce
their encounter rate, or prevent wealth from falling below a floor. A literature search
cannot settle their effect until one rule is selected. Do not call generic nonparticipation
a subsistence requirement without a real-world interpretation and source.

## Passive return and economic growth

[Liu et al. (2021)](https://pubmed.ncbi.nlm.nih.gov/34412229/) extend an asset-exchange
model with exponential economic growth and vary how that growth is allocated by wealth.
They report a critical distinction between growth distributions that preserve mobility
and those that favor richer agents strongly enough to retain condensation.

This is a relevant model lead, but it is not automatically passive interest, a bank
return, or `r > g`. Before implementation, define:

- whether new wealth is created or transferred;
- whether allocation is equal, wealth-proportional, or controlled by another exponent;
- whether exchange and growth occur on the same time scale;
- which baseline holds total wealth fixed for comparison.

## Monetary policy

**Status:** Metaphor without a mechanism.

Money creation, asset purchases, interest-rate changes, and equal cash injections are not
the same operation. Do not add a "central bank" control until the state variables and
allocation rule correspond to one named mechanism. A generic money-supply slider would
hide the main causal choice: who receives newly created wealth.

## Verdict

**Defer.** The growth-allocation paper is a useful concrete lead. Subsistence and monetary
policy remain model-definition tasks before they become literature-review questions.

## Sandbox interest mechanism (2026-07-06, M9 build)

The sandbox (`src/lib/widgets/sandbox/SandboxWorld.ts`) adds a "passive income"
dial. Mechanism and accounting, for the record:

- State stays shares-summing-to-1 plus one `totalDollars` scalar. Interest is a
  **uniform return on capital**: `totalDollars *= (1 + r)` once per round. It
  changes what a share is *worth*, never who holds it — shares are untouched,
  Gini is unchanged by interest alone.
- Its distributional bite appears only through **dollar-denominated brackets**:
  a growing total pushes more agents across progressive thresholds, so the same
  bracket schedule collects more as the room inflates (tested:
  `SandboxWorld.test.ts` "growing total pushes agents across dollar thresholds").
- Flat levies are proportional and therefore scale-free — interest and a flat
  levy never interact.
- This is a TOY surface. It is not a model of returns-to-wealth heterogeneity
  (r > g style advantages would require per-agent rates — a different, gated
  extension), and no prose claim rides on it.

## Interest renormalization — owner idea (2026-07-08, deferred)

Owner reaction to the uniform-return dial: the money growing is acceptable, but
renormalizing after interest "does not sound bad" — framed as the **reverse of a
flat tax**: collect a share from everyone, redistribute **in proportion to
wealth** (anti-equalizing), keeping the total constant.

Accounting notes before any build:

- Uniform proportional interest + renormalize total = shares literally unchanged
  (a no-op on the distribution). The idea has bite only if the collect step is
  not proportional — e.g. a flat per-capita amount from all, redistributed
  proportionally to wealth. That is a true reverse-levy: regressive, conserves
  the total, and is the mirror image of `applyFlatWealthLevy`.
- Owner constraint: **no threshold/wealth-dependent rate complexity.**
- Status: owner is still thinking; keep the current uniform-return dial shipped.
  Do not build the reverse-levy until he decides.

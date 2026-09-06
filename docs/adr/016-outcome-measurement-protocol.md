# ADR 016 — Versioned independent outcome measurements

**Status:** Accepted, 2026-08-30

## Context

The original sandbox used one setting, `taxEvery`, for both levy timing and the meaning
of a recorded round. Its map then counted several agreeing tail windows from one
continuous room as repeated measurements. Changing policy cadence changed the metric
window, and correlated windows appeared to be independent evidence.

The human argument now needs effective participants and ordinary wealth turnover.
Turnover must exclude redistribution or a levy would mechanically manufacture the
activity credited to it.

## Decision

1. A measurement round and a policy event are independent clocks. The guided default is
   one measurement round per `N` trades and one structural levy per measurement round.
2. Ordinary turnover counts the Yard-Sale stake once and divides the round total by
   conserved wealth. Structural and manual levy flows are accumulated separately.
3. A map contribution is one completed finite run from one fresh seed under one immutable
   `ExperimentProtocol`. Tail checkpoints within that run form its estimator; they are
   not additional independent runs.
4. Protocol identity includes population, measurement cadence, levy cadence, horizon,
   burn-in, tail sampling, and schema version. Stake and levy settings identify a cell.
5. Each metric keeps its own sum and count. A legacy Gini observation migrates as Gini
   only; missing effective-participation or flow values are never fabricated.
6. Research code remains strict. The sandbox remains deliberately tolerant of arbitrary
   finite expert values; broken outcomes stay visible but do not enter aggregates.
7. The simulation engine and `SimState` do not acquire metrics, experiment records, or
   presentation state. Harnesses compose the existing trade primitive outside the engine.

## Consequences

- Levy frequency can change without redefining a round or corrupting comparisons.
- Tax and dividend movement cannot masquerade as ordinary trade activity.
- Aggregate counts mean independent rooms, not stable-looking windows.
- Storage and CSV formats need versioned migration and protocol-aware keys.
- A zero-tax cell is a finite-horizon outcome, not a stationary-state claim.
- The measured `levy ≈ c × stake²` family may be fitted to a named continuous outcome,
  but it is not a phase boundary or universal policy law.

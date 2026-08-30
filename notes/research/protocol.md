# Research protocol

## Evidence rules

1. Use reviews to find work, then cite the primary theorem, model, experiment, or standard.
2. Record the exact equation and assumptions before borrowing a paper's conclusion.
3. Separate theorem, local calculation, seeded observation, interpretation, and metaphor.
4. Predeclare controls and summary metrics before treating an exploratory run as evidence.
5. Retain nulls, reversals, and failed analogies.

## Reproducibility

- Research runs provide an unsigned 32-bit seed. Seeded `reset()` replays the run.
- `npm run research` executes protocol version 1 and writes JSON to standard output.
- The script records seed lists and parameters; stored results are rounded summaries, not
  a substitute for rerunning the script.
- The q05, median, and q95 values are descriptive ensemble quantiles. They are not
  confidence intervals.

## Metric definitions

- **Gini:** standard finite-population Gini. Its maximum is `(N - 1) / N`, not one.
- **Top share:** largest current wealth divided by total wealth.
- **Effective participants:** inverse Herfindahl count, `1 / sum(share_i^2)`.
- **Ordinary wealth turnover:** sum of Yard-Sale stakes transferred during one
  measurement round, divided by total wealth. Count the transfer once, not both balance
  changes. Levy and dividend transfers are excluded.
- **Levy flow:** wealth collected by structural or manual levies during one measurement
  round, divided by total wealth. It is reported separately from turnover.
- **Trades per agent:** total pairwise trades divided by `N`.
- **Wealth floor:** minimum current wealth.
- **Lorenz curve:** cumulative sorted wealth against cumulative population.

## Protocol version 1

- Baseline: `N = 100`, `beta in {0.1, 0.25, 0.5}`, seeds `0..29`, and checkpoints
  `0, 1,000, 10,000, 100,000` trades.
- Static topology: `N = 100`, `beta = 0.25`, seeds `0..29`, ring, 10-by-10 torus, and a
  ring-backed connected random graph with extra-edge probability `0.03`.
- Weighted access: `N = 30`, `beta = 0.25`, seeds `0..9`, exponent `0, 0.5, 1`, and
  `10,000` final trades.
- Additive reshuffling: `N = 100`, seeds `0..29`, and `100,000` final trades.
- Matched-budget intervention: `N = 100`, `beta = 0.25`, seeds `0..29`, 100 cycles of
  1,000 trades followed by a `0.002` wealth levy and equal dividend. Seeds `0..19` are
  development runs and `20..29` are reported separately as held-out runs.

## Acceptance

Per-trade conservation, non-negativity, expected-transfer symmetry, replay, metric
formulas, matched levy budgets, and graph-edge sampling are automated tests. A narrative claim additionally
needs an appropriate ensemble, uncertainty summary, mechanism controls, and held-out
seeds. Protocol version 1 is exploratory outside the baseline and additive controls.

## Outcome protocol version 2

The reader-facing outcome map is a finite-run experiment record, not a steady-state or
phase record.

- `N = 100` for the guided map.
- One measurement round is always `N` ordinary trades.
- The guided structural levy is assessed once per measurement round.
- Each run records stake, levy rate, measurement cadence, levy cadence, total horizon,
  burn-in, tail-sample count, seed, and protocol version.
- The default comparison horizon remains 200,000 trades with burn-in at 120,000 trades
  and eight evenly spaced tail checkpoints until a replacement is preregistered.
- Every tail checkpoint records Gini, effective participants, ordinary turnover, and levy
  flow from the same state and measurement window.
- One fresh seed contributes exactly one independent outcome bundle. Multiple windows
  from one continuous room are correlated observations, not additional runs.
- Zero-tax cells are finite-horizon observations. They are never described as stationary
  interior states.
- Aggregate cells retain an independent sum and count per metric. Missing legacy metrics
  remain missing rather than being inferred from Gini.
- Storage and CSV identity includes population, measurement cadence, levy cadence,
  horizon, burn-in, tail sampling, and protocol version. Results from different protocols
  never merge silently.

### Ensemble convergence gate

Evaluate replicate counts `4, 8, 16, 32, 64`. Select the smallest count for which
doubling replicates changes the median cell mean by no more than two effective
participants and changes the fitted `tau = c * beta²` coefficient by no more than 5%.
If the grid has not passed by 64 replicates, publish continuous measurements without a
fitted curve.

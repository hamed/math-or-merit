# Protocol-v1 results

These are rounded descriptive summaries from `npm run research`. Rerun the command for
full q05/median/q95 output and exact parameters. They are not calibrated claims about a
real economy.

## Baseline at 100,000 trades

`N = 100`, 30 seeds, or 1,000 trades per agent. The finite-population maximum Gini is
`0.99`.

| beta | Median Gini | Median top share | Median effective participants |
| ---: | ---: | ---: | ---: |
| 0.10 | 0.881 | 0.179 | 10.96 |
| 0.25 | 0.972 | 0.548 | 2.61 |
| 0.50 | 0.989 | 0.937 | 1.13 |

**Interpretation:** concentration timing depends strongly on the stake fraction. This is
finite-time ensemble evidence, not an estimated convergence law.

## Static topology at 100,000 trades

`N = 100`, `beta = 0.25`, 30 seeds.

| Graph | Gini | Top share | Effective participants | Local rich | Neighbor correlation |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ring | 0.699 | 0.050 | 33.62 | 41.0 | -0.507 |
| 10x10 torus | 0.820 | 0.088 | 19.91 | 30.5 | -0.249 |
| Connected random | 0.832 | 0.107 | 18.24 | 30.0 | -0.201 |

**Interpretation:** topology changes finite-time behavior. Longer scaling and local-rich
summaries are required before a limiting claim.

## Weighted access at 10,000 trades

`N = 30`, `beta = 0.25`, 10 seeds. The finite-population maximum Gini is about `0.9667`.

| Exponent | Gini | Top share | Effective participants | Encounter/wealth correlation |
| ---: | ---: | ---: | ---: | ---: |
| 0.0 | 0.9231 | 0.6812 | 1.978 | 0.008 |
| 0.5 | 0.9667 | 0.99996 | 1.00007 | 0.991 |
| 1.0 | 0.9667 | 0.99998 | 1.00004 | 0.996 |

**Interpretation:** positive wealth-weighted access greatly accelerates concentration in
this sampler. It is not yet a physical collision or preferential-attachment result.

## Random reshuffling control at 100,000 trades

`N = 100`, 30 seeds: median Gini `0.502`, median top share `0.052`, and median effective
participants `49.50`.

**Interpretation:** the control remains broadly distributed at the same checkpoint where
the Yard-Sale baseline is concentrated. An exponential goodness-of-fit test remains.

## Matched-budget levies at 100,000 trades

Each protocol collected and equally redistributed total wealth `0.2`. Held-out seeds
`20..29` produced these medians:

| Incidence rule | Median Gini | Median top share | Median effective participants |
| --- | ---: | ---: | ---: |
| Perfectly target current richest | 0.947 | 0.476 | 3.31 |
| Flat above exemption | 0.949 | 0.508 | 3.16 |
| Progressive liabilities | 0.948 | 0.487 | 3.26 |

**Interpretation:** these endpoint distributions overlap substantially. Under this one
budget and perfect-information setup, there is no evidence for the planned rhetorical
claim that the structural rules clearly outperform repeated targeting.

# Research

Master claim ledger and index for the evidence behind **Math or Merit?** Detailed source
and experiment notes live in [`research/`](research/). A runnable descriptive study is
available through `npm run research`.

## Status vocabulary

- **Established** - supported by a source whose model and claim match ours.
- **Observed here** - reproduced by a seeded experiment under a recorded protocol.
- **Hypothesis** - testable, but not yet established or adequately reproduced.
- **Metaphor** - explanatory resemblance, not mathematical equivalence.
- **Design choice** - an authored visual, narrative, or interaction decision.
- **Deferred** - worth preserving, but its prerequisites are not ready.
- **Rejected** - contradicted, misleading, or outside the model.

## Claim ledger

### C1 - The implemented baseline conserves total wealth

- **Status:** Established and tested.
- **Conditions:** Any finite population, `0 <= beta <= 1`, one selected distinct pair,
  and the implemented transfer `beta * min(w_i, w_j)`.
- **Evidence:** The two changes are equal and opposite; unit tests cover long runs.
- **Limitation:** Conservation does not make the resulting distribution equitable or
  make the model a realistic economy.
- **Essay-safe wording:** "Every trade moves wealth; it does not create or destroy it."

### C2 - A fair trade preserves each selected agent's conditional expected wealth

- **Status:** Established and tested.
- **Conditions:** The winner is chosen independently with probability one half.
- **Evidence:** Direct expectation of the two possible transfers; seeded Monte Carlo test.
- **Limitation:** "Fair" here means zero expected monetary drift per trade. It says
  nothing about utility, bargaining, opportunity, exposure, or real-world fairness.
- **Essay-safe wording:** "Given the current fortunes, neither trader has an expected
  monetary advantage in this trade."

### C3 - The baseline cannot create negative wealth

- **Status:** Established and tested.
- **Conditions:** Non-negative starting wealth and `0 <= beta <= 1`.
- **Evidence:** The loser risks no more than the poorer participant owns.
- **Limitation:** Debt is absent by construction.
- **Essay-safe wording:** "No one can lose more than they currently have."

### C4 - The finite fair baseline condenses almost surely

- **Status:** Established.
- **Conditions:** Finite `N`, uniformly selected pairs, fixed `0 < beta < 1`, fair
  independent directions, and unlimited mathematical time.
- **Evidence:** Börgers and Greengard's finite-agent convergence theorem, following the
  martingale argument in the earlier literature.
- **Limitation:** This is asymptotic, not a fixed deadline. `beta = 0`, `beta = 1`, finite
  precision, and finite-time thresholds are separate cases.
- **Source:** [Börgers and Greengard (2023)](https://arxiv.org/abs/2308.01485).
- **Essay-safe wording:** "If the idealized game continues indefinitely, its wealth
  vector converges with probability one to a state where one agent owns everything."

### C5 - Inequality need not rise on every realized trade

- **Status:** Established.
- **Conditions:** A finite realized trajectory.
- **Evidence:** If the poorer participant wins, a trade can make a pair more equal. The
  Gini H-theorem concerns distribution-level kinetic equations, not monotonicity of every
  sample path.
- **Source:** [Boghosian, Johnson, and Marcq (2015)](https://arxiv.org/abs/1412.7227).
- **Essay-safe wording:** "The path can wobble toward equality even while the long-run
  process heads toward concentration."

### C6 - `beta = 0` does not condense

- **Status:** Established and tested.
- **Conditions:** Exactly zero stake.
- **Evidence:** Every transfer is zero.
- **Essay-safe wording:** "With nothing at stake, nothing changes."

### C7 - Static encounter graphs support local rather than necessarily global condensation

- **Status:** Established for the cited graph model; observed here only at finite times.
- **Conditions:** A fixed allowed-trade graph and the paper's stated exchange assumptions.
- **Evidence:** Local-condensation theorem and earlier network simulations.
- **Sources:** [Börgers and Greengard (2024)](https://arxiv.org/abs/2406.10978),
  [Bustos-Guajardo and Moukarzel (2012)](https://arxiv.org/abs/1208.4409).
- **Limitation:** Moving particles create a time-varying graph and are not covered by this
  wording.
- **Essay-safe wording:** "Restricting who can meet can leave several separated local
  concentrations instead of one global winner."

### C8 - Wealth-weighted access changes the observed route and rate

- **Status:** Observed here, exploratory.
- **Conditions:** The research sampler weights selection by `(wealth + offset)^alpha`.
- **Evidence:** Protocol-v1 ensembles in [`results.md`](research/results.md).
- **Limitation:** This sampler is not a disk-collision model and does not establish
  preferential attachment or a phase class.
- **Essay-safe wording:** None yet.

### C9 - Random pair reshuffling and Yard-Sale exchange are different models

- **Status:** Established; qualitative reproduction observed here.
- **Conditions:** Closed, non-negative random reshuffling as defined by Drăgulescu and
  Yakovenko versus the poorer-wealth Yard-Sale stake.
- **Evidence:** The rules and limiting claims differ at equation level.
- **Source:** [Drăgulescu and Yakovenko (2000)](https://arxiv.org/abs/cond-mat/0001432).
- **Essay-safe wording:** "Conservation alone does not select one distribution; the
  exchange rule matters."

### C10 - Yard-Sale exchange does not break conservation

- **Status:** Rejected misconception.
- **Evidence:** C1.
- **Forbidden wording:** "The multiplicative variant breaks conservation just enough."

### C11 - Valence and arousal can organize an authored display state

- **Status:** Design choice informed by research.
- **Evidence:** Russell motivates a two-dimensional organization of affect concepts; the
  project implements only an abstract phasic display state.
- **Source:** [Russell (1980)](https://doi.org/10.1037/h0077714).
- **Limitation:** A gain, loss, or levy is not asserted to cause a universal human emotion
  or facial expression.
- **Essay-safe wording:** Describe animation mechanics, not simulated psychology.

### C12 - The retrospective-winner interaction is not yet a psychology experiment

- **Status:** Design choice; named construct deferred.
- **Evidence:** Outcome knowledge can bias decision evaluation, but the proposed
  interaction also involves causal attribution and generated storytelling.
- **Source:** [Baron and Hershey (1988)](https://doi.org/10.1037/0022-3514.54.4.569).
- **Essay-safe wording:** "Watch how easily a result invites a story" rather than "this
  demonstrates outcome bias."

### C13 - Current levy experiments do not support real tax-policy conclusions

- **Status:** Observed here for toy-model states; policy interpretation rejected.
- **Conditions:** Wealth levies with immediate equal dividends and no production,
  income, behavior, avoidance, enforcement, debt, or growth.
- **Source lead:** [Boghosian (2014)](https://arxiv.org/abs/1407.6851).
- **Essay-safe wording:** "Inside this toy exchange process..."

## Workstream index

- [Research protocol](research/protocol.md)
- [Baseline model](research/baseline.md)
- [Encounter topology](research/topology.md)
- [Wealth, size, and access](research/wealth-size-access.md)
- [Physical analogy](research/physical-analogy.md)
- [Affect, interpretation, and art direction](research/affect-interpretation.md)
- [Art-direction reference register](research/art-direction-references.md)
- [Levies and intervention games](research/interventions.md)
- [Idea disposition audit](research/idea-disposition.md)
- [Protocol-v1 results](research/results.md)

## Promotion gate

Material enters the essay only when the exact model matches its source or reproducible
experiment, limitations sit beside the claim, ensemble evidence supports variable
outcomes, and the workstream memo has an explicit **Include** verdict. Null and
contradictory results remain in the record.

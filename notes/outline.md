# Outline

The working narrative for **Merit or Math?** Each numbered beat is what the reader
experiences — the emotion, the realization, the question. This is a story order, not a
frozen screenplay; beats may shift as prototypes develop. The concepts and evidence gates
survive any reordering.

**Tags:** **[GATE]** needs evidence clearance before entering prose · **[TEST]** needs
formative reader study · **[OPEN]** design question unresolved.

Only evidence-cleared model claims may enter published prose. Open mechanisms and
research-dependent claims stay in `ideas.md` and `research/` even when a beat reserves a
future place for them.

---

## Narrative principles

- Voice is first-person direct address: *I* narrates, *you* are the reader. Casual, a
  little provocative, not over-polished. Fun is good.
- Teach every concept immediately before the reader needs it. Never ahead.
- Let the reader experience the paradox; do not announce it. Ask for a prediction first,
  then let the simulation answer.
- Animations respond to story events or scroll position. No coupling to word counts or
  fixed delays. Scroll-reversible where practical. Simulation-result animations have a
  different contract: reversing a stochastic run is not the same as reversing an authored
  transition.
- Prefer one illustration per section that morphs as the text develops, over several static
  figures. Presentation polish — slide-like text in/out, exact morph triggers — is deferred
  until the words are settled. (added 2026-06-23, see `draft-decisions.md` D5)
- Show multiple seeded worlds. One vivid trajectory is an example, not evidence.
- State the model's claim precisely: a fair local exchange process can produce
  concentration. The model does not prove that real inequality is inevitable or that merit
  is unreal.

---

## The story

### Prologue

**1. The trillionaire headline**
A real, dated, citable news report: Elon Musk's estimated net worth crosses one trillion
dollars for the first time — *on paper*. The qualifier is immediate; the estimate moves
with asset prices. Source and date are explicit.

**2. Merit, or math?**
The word **MERIT** appears first, large. Then *or math?* arrives — the title reveal in
two beats. The familiar story comes first; the mathematical challenge is the question. No
answer yet.

---

### Chapter I — The simplification

> **Structure note (2026-06-23):** beats 3–7 were merged and reordered during the prose
> draft — see `draft-decisions.md` D3 and D5. The arc is now three beats — the joke (cow),
> the spherical human, then the money — each carried by ONE morphing illustration. The
> uphill test is part of the cow drawing; the Musk cartoon simplifies into the circle.
> Chapter II still begins at beat 8; the numbering gap is intentional.

**3–4. The spherical cow and the uphill test** ← *carries the essay's core argument*
The joke: a farmer's cow stops giving milk; the physicist's answer is *"First, assume a
spherical cow. In a vacuum."* One illustration morphs: cow → sphere → vacuum → the uphill
test. The joke teaches that we remove detail on purpose. The uphill test then earns the
load-bearing inference (the old beat 4) without a formal proof: a spherical cow is the
*easiest* cow to push uphill, so if even it won't move, no shape of cow will — *"the problem
was never the shape, it was the weight."* Shape = the biography we discard; weight = the
mechanism we can't. Honesty guard: this claims only that an obstacle present in the ideal
case survives into messier cases — not that every richer model behaves identically.

**5–6. The spherical human** ← *Musk morph restored*
Same trick, new subject: *"First, assume a spherical human. In a vacuum."* One illustration
morphs a recognisable cartoon of the trillionaire from the opening — person → rough figure →
blob → circle — as the prose strips biography (companies, contracts, inheritance, talent,
luck, every argument about whether it was earned). Land the reduction line as criticism of
the abstraction, not the essay's view of a person: *"You are your net worth"* — authored and
deliberately wrong; no real quote asserts it (see `draft-decisions.md` D6 for the verified
inversion candidates: Fight Club, Orman, Aurelius). Causal guard, brief §4: *"we are not
going to explain how he got it"* — the morph is methodological, never a claim about the cause
of his fortune. Closer rhymes with the cow: *"the weight was never the shape of the person.
It was the math."*

**7. Then we add the money — wealth as circle size**
The same circle now gains size: a coin drops in and it grows. Area is proportional to wealth
(`radius = scale × √wealth`); the eye reads area, so teach it honestly — twice as wide is
four times as rich. This beat exists only to teach the encoding before the game. Bigger
circle, more wealth; then everyone starts equal and begins to trade.

**[TEST]** Study A in `reader-study.md`: can readers rank order, detect direction of
change, and estimate rough ratios without relying on color?

---

### Chapter II — The fair game

**8. One encounter**
Two distinct participants, chosen uniformly at random. The stake: a fixed fraction of the
poorer participant's wealth. A fair coin decides who receives it. The winner gains exactly
what the loser loses. Zero expected monetary gain for either party — that is the narrow
meaning of "fair" in this model. Not moral justice. Not equal happiness. Just: the coin
gives neither trader an expected monetary advantage.

**9. Scripted rounds — confirm the intuition**
A few authored outcomes: A wins, then loses it back, then a three-way return to equality.
Label this as instruction, not a random run. End back where we started. The reader
watches the rule confirm: everything is symmetric, everything can return to equal, nothing
surprising is happening here. This beat lets the reader build up a wrong expectation —
the reveal in beat 11 depends on it.

**10. Ask for a prediction**
Everyone starts equal. Pairings are random. Winning odds are fifty-fifty. The scripted
rounds just confirmed the rule is perfectly fair. Now: *what do you expect if this runs
for ten thousand trades?* Let the reader commit before seeing the result.

**11. The main reveal**
Run the actual yard-sale rule. No controls — pre-tuned preset, no user interference. One
participant grows enormous; others shrink toward nothing. The rule was fair in every
individual trade. The system is not.

**12. Run again**
*"Don't believe it? Run it again."* Each new seed crowns a different winner. The pressure
toward concentration repeats; the winner does not. Silently log each run — the data will
build the histogram.

**13. The merit illusion** ← *the payload*
End state: one enormous participant. Every participant had arbitrary, causally inert traits
assigned before the run began. Stage the success story as a **generated news headline** that
crowns the winner using their most distinctive trait, reusing the opening `headline-card`
motif — *"Squares: the shape of success."* This is a deliberate callback: the essay opened on
a real headline, and now manufactures fake ones about random circles (close the loop with
"Remember the headline we started with?"). Then disclose: that trait never entered the
pairing, the stake, or the coin. Run again — a different winner, a different headline, equally
convincing. The frame: *"Watch how easily a result invites a story."*

Do not name a specific cognitive bias. This is an authored illustration, not a psychology
experiment. The pass condition is that readers understand the trait was causally inert and
the story was selected after the outcome.

**[TEST]** Study D in `reader-study.md`.

**[OPEN]** After each run, offer: *"convinced, or run again?"* — the reader chooses their
own stopping point.

---

### Chapter III — Reading the room

**14. From people to histogram**
Too many faces to read individually. Move the participants from the last run physically
into wealth bins — the bars grow out of objects the reader already knows. State the bin
rule explicitly. Bin width is an analytical choice, not a neutral container.

**[TEST]** Study B in `reader-study.md`: histogram vs. cumulative view. Choose based on
comprehension, not familiarity.

**15. Why a log scale**
The linear view crushes most participants near zero and sends the winner off the screen.
Show both axes side by side. Teach: equal spacing on a log axis means equal *ratios*, not
equal differences. "Count the zeros" is the entry point for exact powers of ten. Zero has
no logarithm; show how near-zero participants are handled separately. Check comprehension
before asking the reader to infer anything from the transformed view.

**[TEST]** Study C in `reader-study.md`.

The log view reveals compressed values. It does **not** establish a power law. **[GATE]**
A fit, goodness-of-fit test, and comparison with alternatives are required before any
distributional-family claim. Omit "power law" from the baseline arc entirely.

**16. The larger experiment**
The mechanics, the outcome, and the log view are all familiar now. Run a larger seeded
population. The reader reads the result themselves.

**17. The long-run result**
State the mathematical claim with its qualifiers intact: for finite N, uniform random
pairing, fixed `0 < β < 1`, and a fair independent coin, the wealth vector converges with
probability one to a state where one agent owns everything. This is an asymptotic
statement about an indefinitely continued idealized process — not a deadline promised by
the animation.

The modern finite-agent statement is given by Börgers and Greengard (2023); related
kinetic work shows how the Gini behaves at the distribution level.

---

### Chapter IV — Change the rules

**18. The stake slider**
Let the reader vary β. Concentration still arrives; finite-time speed changes. Separate
the asymptotic result (the same for every fixed β > 0) from the visibly different rates.

**[GATE]** Confirmatory grid across N, β, and seeds before claiming precise timing
relationships. See `baseline.md`.

**19. You are the redistributor**
The reader becomes the tax collector directly: click a wealthy participant, watch wealth
pulled out and distributed. Reactions visible. Gives the mechanism a physical, reactive
quality before it becomes automatic.

**[OPEN]** Auto-redistribute equally vs. reader chooses the recipient. The choice changes
whether the lesson is about the *possibility* of redistribution or the *difficulty* of it.

**20. The automatic rule**
A periodic wealth levy and equal dividend run as a structural policy inside the same
process. Call it a wealth levy, not an income tax — those are different mechanisms. Compare
with the manual game at matched budgets and matched information.

**21. Gini — now you need a number**
Introduce the Gini coefficient here, when the reader needs to compare whole distributions
across runs. Anchor it: 0 means everyone has equal wealth; with 100 agents and one winner,
the maximum is 0.99, not exactly 1. Keep top share alongside it as the intuitive audit.
Do not imply Gini rises on every individual trade.

Introduce it at the moment it becomes useful — not in the distribution chapter.

**22. Design a progressive rule**
Move from a flat levy to a rate that rises with wealth. Let the reader shape the curve:
drag thresholds across the distribution, set rates, test the rule on held-out seeds. It
is a wealth levy; income, transaction gain, and wealth are different quantities and
different models.

**[GATE]** Lima, Vieira, and Anteneodo (2022) is the closest literature lead; exact
mechanism, timing, and normalization must be matched before importing results. See
`interventions.md`.

**23. Map parameter space**
Optional. As the reader explores, log (β, levy rate) → Gini and show a phase-style
diagram. Show it only if a reproducible grid supports meaningful regimes or transitions;
explored points alone do not establish a theoretical phase boundary.

**[GATE]** Not established. Stable finite-size regimes across population sizes, run
lengths, seeds, and exact levy rule are required before this beat ships.

---

### Ending

**24. What the toy leaves out**
Production, income, debt, labor, work, bargaining, institutions, behavior, avoidance,
growth, inheritance, power, and claims about actual people. Naming the omissions is not
an apology — it is the boundary around the claim.

**25. Return to the headline**
We started with a person and a number. The model studied one fair mechanism in isolation
and found: local symmetry does not guarantee a globally equal outcome. That is a smaller,
sturdier claim than "this explains Musk's fortune," and it is the uncomfortable one.

There was no biased coin to expose. There was no villain in the code. Nothing was unfair.
That was the unfairness.

---

## Gated extensions

Build only after the core arc ships and the evidence gates below are cleared:

- **Additive exchange contrast** — after exponential-fit replication in
  `physical-analogy.md`.
- **Static topology** — after degree-controlled ensemble results in `topology.md`.
- **Size-dependent interaction frequency** — treat agents as particles with
  wealth-proportional collision cross-sections. After mechanism definition and controls in
  `wealth-size-access.md`. Do not import Barabasi-Albert language without derived
  equivalence.
- **Passive return on capital, subsistence floor, monetary policy lever** — each needs a
  defined mechanism and conservation accounting before entering the essay. See
  `extensions.md`.
- **Physical-system analogies** — at the strength supported in `physical-analogy.md`.
  The Bianconi-Marsili network result does not currently support a shared universality
  claim with the Yard-Sale model.

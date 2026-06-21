# Ideas - Math or Merit?

Loose thoughts, hypotheses, metaphors, interactions, and visual possibilities.

This is a concept notebook, not a specification. Nothing here is authoritative about
the architecture or a promised result. The accepted ADRs and the code describe what is
currently decided. Ideas move out of this file only after they become one of the
following:

- a supported factual claim or source in `research.md`;
- an ordered part of the essay in `outline.md`;
- polished language in `copy.md`;
- an accepted architectural decision in an ADR;
- an implemented and tested behavior in the code.

Use these labels while thinking:

- **Established foundation** - supported outside this project, but still needs a source.
- **Hypothesis** - a prediction that the simulation should test, not prove by design.
- **Open question** - interesting precisely because the result is unknown.
- **Design possibility** - a candidate interaction, visual, or narrative device.

The goal is not to remove uncertainty. It is to keep uncertainty visible until an
experiment, source, or deliberate decision resolves it.

**Retention rule:** Do not delete an idea merely because it is crude, contradictory,
impractical, or probably wrong. Preserve it with a status label and place a correction or
counterargument beside it. Brainstorming records the space we knew to consider; later
documents decide what survives contact with evidence and implementation.

---

## Current center

The project begins with a simple paradox: equal starting wealth and fair local exchanges
can still produce extreme concentration.

The larger idea may be that physical and social systems can share the same abstract
shape:

1. maintain a world of participants;
2. select two participants who encounter each other;
3. apply a pairwise interaction rule;
4. update the world;
5. show what happened.

This suggests one reusable simulation pipeline that could have multiple instances,
multiple encounter mechanisms, or multiple visual interpretations. It does not yet decide
whether the physical and economic scenes are:

- two views of the same underlying run;
- two instances using the same interaction rule;
- two related but deliberately different models shown side by side.

That choice should be made for explanatory honesty, not only implementation convenience.

---

## A useful conceptual split

An earlier name for this split was **GAME / SOCIETY / INDIVIDUAL**:

- **game** - the two-body economic rule;
- **society** - the topology or process that brings two agents together;
- **individual** - the displayed being that reacts and also has a small life of its own.

An even earlier slicing was **space / economics / affect**. The concern was that
"economics" might then fuse pair selection with the transaction rule. Keeping both
vocabularies here is useful: one may prove clearer in the essay even if another produces
cleaner implementation boundaries.

The strongest intuition behind GAME / SOCIETY is that swapping the substrate while
holding the pairwise rule fixed could become the heart of the universality argument. An
early analogy was that an Ising transition does not depend on one particular lattice.
Whether the Yard-Sale experiments justify the same kind of claim is an open scientific
question, not yet a premise.

### World

The world may contain per-agent fields such as identity, wealth, position, velocity, and
other experimental state. Owning a field does not mean every part of the simulation may
use it.

### Encounter selection

Selects who interacts. Candidate mechanisms include:

- uniform random pairs;
- pairs connected in a network;
- nearby agents in an embedded 2D space;
- agents whose moving bodies collide;
- selection biased by an explicit property such as collision radius.

### Interaction rule

Determines what happens once a pair has been selected. The baseline candidate is the
Yard-Sale exchange. The rule should not quietly read position, appearance, or the identity
of the encounter mechanism.

### Presentation

Turns state and economic outcomes into graphics, motion, sound, and prose. Presentation
may have its own state and animation, but normally does not affect the simulated economy.
Any exception, such as visible size also becoming physical collision size, must be an
explicit experimental coupling rather than an accidental consequence of drawing.

### Harness

Turns a simulation into a sandbox, guided demonstration, or mini-game. Goals, scores,
player actions, and instructions belong here conceptually rather than in the economic
rule.

This split is a candidate direction. Exact interfaces, event formats, and ownership
boundaries remain implementation questions.

---

## Experiment: baseline Yard-Sale exchange

**Established foundation:** The fair Yard-Sale model is expected to concentrate wealth
over time. The exact claims, assumptions, limiting behavior, and appropriate citations
belong in `research.md` before they enter the essay.

**Purpose:** Establish the load-bearing result without spatial advantage, skill,
wealth-biased winning, or wealth-biased access to trades.

**Controls:**

- equal initial wealth;
- uniform random pair selection;
- symmetric chance of winning each trade;
- no visual property feeding back into the simulation.

**Possible measurements:**

- wealth distribution;
- top wealth share;
- Gini coefficient;
- number of trades;
- time to a defined concentration threshold;
- variation across random seeds.

The piece should show multiple runs or ensemble summaries where a single run could create
a misleading story.

---

## Experiment: different societies select different pairs

**Hypothesis:** Changing the encounter topology may change the route, spatial pattern, and
speed of concentration even when the transaction rule stays fixed.

**Open questions:**

- Does a connected spatial system approach one global winner?
- Do restricted or weakly connected systems form several local concentrations?
- How strongly do initial positions affect the outcome?
- What changes when agents move rather than remain in a fixed neighborhood?
- Which results survive across seeds and population sizes?

**Candidate comparison:**

- uniform random matching;
- fixed local neighborhoods;
- a static network;
- moving agents that transact on collision.

One raw spatial prediction was that repeated encounters with nearby agents would make
wealth move locally, producing slower, more structured dynamics and temporary domains of
concentration before any global winner. This is a picture to test, not a promised result.

**Possible measurements:**

- the baseline inequality measurements;
- wealth correlation by distance;
- concentration within connected regions;
- encounter counts per agent;
- mixing time or repeated-neighbor frequency.

Do not promise "inevitable by different roads" until the relevant assumptions and results
are established. A topology may change more than the route.

---

## Experiment: wealth, visible size, and collision size

**Intuition:** If wealthier agents become physically larger, they may collide with more
agents and therefore participate in more trades.

**Open question:** How does wealth-dependent collision frequency affect activity,
inequality, spatial structure, and time to concentration?

More trades do not automatically imply a positive expected gain when each trade remains
fair. The feedback may change variance, exposure, and the speed or shape of concentration
without creating a direct expected drift. This distinction must be measured rather than
settled by rhetoric.

**Essential controls:**

1. wealth does not affect visible or collision size;
2. visible size follows wealth, but collision size remains fixed;
3. visible and collision size both follow wealth;
4. collision size follows wealth while the visual encoding is held constant, if useful.

These controls separate a graphic encoding from a causal mechanism.

**Geometric question:** "Size" could mean radius, area, or collision cross-section. Those
choices are not interchangeable. For example, making area proportional to wealth requires
a different radius mapping than making radius proportional to wealth. The mapping should
be explicit and tested rather than described as cosmetic.

**Possible measurements:**

- encounters per agent as a function of wealth;
- expected and realized wealth change by current wealth;
- volatility by current wealth;
- concentration time and top share;
- collision-rate distribution;
- sensitivity to the size mapping.

Calling this preferential attachment or assigning it a known phase class remains a
research question. Similar-looking feedback is not enough to establish mathematical
equivalence.

### Raw attachment intuitions and rhetoric to retain

- An early intuition was: "the rich do not only win more per trade; they get more
  trades." The second half may follow from wealth-dependent collision size. The first
  half is ambiguous and may be false in expectation for a fair trade, so the experiment
  should distinguish stake size, realized gain, expected gain, and trade frequency.
- The feedback was compared to preferential attachment in the Barabasi sense: wealth
  increases size, size increases encounters, and encounters create more opportunities
  for wealth change. This may be illuminating even if it is not mathematically the same
  process.
- A toggle between uniform pairing and size-biased pairing may be one of the strongest
  pedagogical controls. It first answers "you built rich-get-richer into the model" with
  the uniform baseline, then asks what changes when unequal access to interactions is
  deliberately added. It is "Math or Merit?" made into a knob.
- Uniform pairing should probably appear first because it carries the fair-process
  paradox. Size bias is an additional twist; leading with it may let the reader dismiss
  concentration as a built-in advantage.
- A raw mathematical analogy linked the exponent of a wealth-to-size mapping to nonlinear
  preferential attachment: sublinear attachment without a hub, roughly linear attachment
  with a scale-free tail in the Barabasi-Albert class, and superlinear attachment with a
  winner-take-all or Bose-Einstein-like condensate. These regimes belong to another model
  until derived or observed here, but they are valuable research leads.
- The larger unification dream was a common phase-transition story across photons,
  network links, and wealth. That may be too ambitious, but it should remain visible as a
  question rather than disappear because it is currently unsupported.
- If this feedback is implemented, an early containment idea was one explicit
  wealth-to-size-to-collision-rate coupling. This keeps a scientifically optional
  mechanism visible and switchable instead of burying it inside spatial motion.

---

## Experiment: neighborhoods and spatial inequality

**Design possibility:** Let local interactions produce a visible geography of wealth.
The reader might see wealthy and poor regions, local winners, boundaries, or persistent
clusters.

**Open questions:**

- Does local trading alone produce recognizable rich and poor neighborhoods?
- Does it instead produce isolated rich agents surrounded by poorer neighbors?
- Is movement required for segregation?
- What additional mechanism would be needed for agents to sort by wealth?
- Can a neighborhood story be told without implying a result the model did not produce?

Possible mechanisms such as wealth-dependent mobility, affordability, homophily, or
network rewiring must be introduced as separate assumptions. They should not be hidden
inside "2D space."

---

## Physical and economic interpretations

**Design possibility:** Show particles and people as two interpretations of pairwise
stochastic exchange.

Potential forms:

- one run rendered once as people and once as particles;
- two synchronized runs sharing parameters and random seeds;
- a mean-field economic scene beside a collision-driven physical scene;
- a progressive reveal in which social costumes fall away and agents become particles.

**Open questions:**

- Which quantities are genuinely governed by the same equation?
- Which similarities are analogies rather than equivalences?
- Does the physical scene clarify the mathematics or distract from it?
- Is the comparison about identical rules, universality, or only shared structure?

The scientific claim should be no stronger than the equations and sources support. A
visually persuasive analogy is not itself evidence of physical equivalence.

### Raw physical conjectures and metaphors to retain

- A physical-gas scene could be "atoms and stuff": particles meet, exchange a conserved
  quantity, and separate.
- Money-as-energy kinetic models, including the Dragulescu-Yakovenko line of work, may
  provide a useful comparison between additive exchange and the multiplicative
  Yard-Sale rule. The exact relationship and resulting distributions need research.
- An early claim was that additive collisions equilibrate to a Boltzmann or exponential
  distribution while multiplicative exchange condenses. Retain this as a research lead,
  not established copy.
- The earlier phrase "the multiplicative Yard-Sale variant breaks conservation just
  enough" is likely wrong for a rule that conserves total wealth on every trade. Keep the
  phrase here as a flagged misconception to resolve rather than silently losing the
  contrast it was trying to express.
- "The faces were always particles wearing a social costume" is a candidate reveal or
  line of narration.
- "Inevitable by different roads" is a candidate framing if experiments and sources
  justify it. "Not identical everywhere" is the necessary counterweight.
- A raw predicted picture was: mean-field condenses globally and quickly; spatial
  interaction forms local domains before global concentration; additive gas-like exchange
  equilibrates; multiplicative exchange condenses. Every clause needs to be tested or
  sourced independently.

---

## Individuals: economic reactions and independent life

**Design possibility:** Each agent has an ongoing visual life independent of trading:
blinking, breathing, looking around, idle motion, or small variations in posture.

Economic events temporarily perturb that baseline:

- a loss may produce a short negative reaction;
- a gain may produce a short positive reaction;
- magnitude may affect intensity;
- the reaction decays back toward baseline;
- repeated events may overlap or accumulate.

For the placeholder circle, the channels might be color, scale, squash, jitter, or motion.
A face is not required to test the temporal behavior.

### Candidate affect model: valence and arousal

**Design hypothesis:** A two-axis affect model may be a compact bridge between economic
events and visual expression:

- **valence** describes the negative-to-positive direction of a reaction;
- **arousal** describes its intensity or activation.

This is attractive because the simulation already produces quantities that could map
onto those axes. The direction of a wealth change could produce a valence-like impulse,
while the magnitude of the change could produce an arousal-like impulse. Standing wealth
might influence a slowly moving baseline, though whether it should do so is an open
ethical and visual question.

The intended temporal shape is **phasic rather than permanently tonic**:

1. each individual has a baseline visual state;
2. a transaction produces a short affective impulse;
3. the impulse rises, peaks, and decays;
4. the individual returns toward baseline;
5. later impulses may overlap with the remaining response.

A leaky integrator is a candidate mathematical model for this rise-and-decay behavior.
It could make repeated events accumulate temporarily without turning current wealth into
a permanent emotional identity.

Possible mappings for a placeholder circle include:

- valence to a color or directional shift;
- arousal to scale, jitter, speed, or squash;
- impulse magnitude to animation amplitude;
- decay time to how long a reaction remains visible;
- baseline to neutral idle motion, breathing, or posture.

For a later face, the same abstract affect state could drive expression geometry rather
than changing the economic interpretation. Exactly one presentation-layer mapping should
translate economic outcomes into affective inputs, and a separate mapping should turn
those inputs into circle or face geometry.

That economic-to-affect mapping might distinguish loss, gain, and tax, including the
amount involved. A loss was imagined as negative-valence and high-arousal, a gain as
positive, and tax as having its own flavor. Alternative framings such as level versus
velocity or loss-aversion versus symmetric gain/loss should remain local experiments in
that mapping rather than assumptions spread through the renderer.

The rhetorical idea remains useful: the economy does not assign someone a permanent
"sad poor person" identity; a displayed individual reacts to an event and then recovers.
That distinction may let the room's emotional asymmetry emerge from accumulated events
rather than from pre-labeled social categories.

**Scientific status:** Valence and arousal are candidate modeling dimensions, not a claim
of scientific consensus or a literal simulation of human emotion. Whether loss, gain,
standing wealth, and tax should map to them in this way needs research, testing, and clear
essay language. The model is currently appealing because it is expressive and
parameter-light.

The Russell circumplex was the original research lead for the two-axis model. The broader
dimensional-versus-discrete-emotion question is unresolved here and should remain visible;
choosing two dimensions would mean "fits this simulation with few parameters," not "the
science certified two dimensions."

**Open questions:**

- Should the simulation emit economic outcomes, or should presentation infer changes?
- Does standing wealth affect the baseline at all?
- How quickly should reactions rise and decay?
- Should repeated losses accumulate, saturate, or remain independent?
- What is expressive and readable without pretending to simulate real human emotion?

The animation is a visual language for economic events, not evidence that a particular
financial outcome causes a universal human expression. Emotion models, mappings, and
citations belong in research before the essay makes scientific claims about them.

One unresolved data-flow idea is worth retaining in full: the economy could emit the
outcome it already computes, or presentation could infer outcomes by diffing consecutive
state. Emission avoids discarding who won, who lost, who was taxed, and by how much.
Diffing keeps the economy closer to a pure state producer but may be unable to reconstruct
multiple events between frames. In either design, the shared vocabulary should remain
economic rather than visual: the economy never needs to know the word "face."

External notes worth retaining:

- **Note A:** keep one clean place that translates economic meaning into geometry.
- **Note B:** stable identity could come from a seed, with reaction separated from social
  category and deliberate handmade variation in appearance.
- **Note C:** preserve compute isolation as a discipline, but do not add worker or WASM
  machinery until scale requires it.

---

## Visual aesthetic: elegantly human-drawn

**Design possibility:** The eventual people should feel drawn by a skilled human
illustrator, not assembled from sterile vector parts or rendered as generic emoji. The
desired quality is elegant, warm, economical, and slightly imperfect.

Possible characteristics:

- confident, restrained linework rather than excessive detail;
- intentional asymmetry instead of mirrored facial geometry;
- small variations in contour, spacing, posture, and rhythm;
- a limited, coherent palette that feels editorial rather than game-like;
- expressions that remain readable without becoming loud reaction icons;
- exaggeration used selectively to clarify motion or affect;
- enough negative space for many individuals to share a scene without visual noise.

"Procedural" does not have to mean visibly machine-assembled. A future face system could
use a small set of carefully authored shapes, curves, and proportions as a visual grammar,
then vary them from stable seeds within narrow artistic bounds. The craft lives in the
grammar and constraints; randomness supplies identity without replacing art direction.

Independent animation should preserve this quality. Blinks, breathing, glances, and
reactions could have slightly varied timing and hand-tuned easing rather than perfectly
uniform mechanical motion. Imperfection should feel intentional, not noisy.

**Open questions:**

- What drawing tradition or illustrator reference best captures the desired elegance?
- How much variation creates individuality without producing visual stereotypes?
- How subtle can expressions remain while still reading at simulation scale?
- Should outlines, fills, or both carry economic reactions?
- Can the same aesthetic work for circles first and faces later?
- Which features should never be generated or tied to economic outcomes?

The placeholder circle should test timing, grouping, color, and motion without deciding
the face apparatus prematurely. The face system can arrive later without losing this
art-direction goal.

---

## Narrative experiment: explain the winner after the fact

**Design possibility:** Give agents random, causally irrelevant appearances. After a run,
describe the winner's physical appearance or behavior as though those traits explain the
victory. Then reveal that none of those properties entered pair selection or the
transaction rule.

A stronger version could:

1. assign traits before the run;
2. let the reader watch one agent win;
3. generate a plausible retrospective success story;
4. reveal the actual causal inputs;
5. rerun the same cast with a different random seed;
6. generate an equally persuasive story about a different winner.

**Purpose:** Explore hindsight, outcome-based judgment, survivorship stories, and the
human tendency to turn a result into evidence of merit.

**Scientific and ethical questions:**

- Which named cognitive effect is actually being demonstrated?
- Should the reader predict a winner before the run?
- How should the reveal distinguish illustration from a psychology experiment?
- Which traits remain neutral enough to avoid physiognomy and social stereotypes?

Candidate traits include clothing color, accessories, geometric shape, idle-motion style,
or other visibly arbitrary features. Race, gender, disability, and facial morphology
should not become shorthand for merit or failure.

---

## Mini-game: tax the rich

This remains a particularly promising interaction and should survive as its own game.
The player points at or clicks an individual person to tax that person immediately. The
directness matters: targeting a visible individual, seeing their reaction, and trying to
keep up with the moving distribution creates a physical, reactive experience that a
policy editor cannot replace.

The larger product idea was a sandbox plus constrained mini-games, all wrapping the same
simulation:

- **sandbox** - expose many parameters and intervention tools, with no required goal;
- **mini-game** - lock most parameters, expose one or two player actions, and add a score
  or win condition in the surrounding harness.

The original flagship fantasy was intentionally forceful: the player points at rich
agents and taxes them, but cannot react quickly or consistently enough to stop a
continuous structural process. The manual game feels like bailing a boat that refills by
its own physics. A structural tax or redistribution rate is then revealed and stabilizes
inequality without frantic clicking. The lesson would be felt before it is stated: a
structural problem needs a structural intervention.

One version placed that automatic tax rate directly in the pairwise interaction rule;
another could model it as a separate policy applied consistently over time. Both remain
available until the economic meaning and comparison are designed.

That desired lesson must not be smuggled in as a result. Keep both possibilities visible:

- **design ambition:** tune the constrained mini-game so point-and-shoot genuinely cannot
  win, because insufficiency is what the interaction is meant to express;
- **scientific counterweight:** first test when manual intervention succeeds or fails,
  disclose the constraints, and do not present game balancing as a discovered economic
  law.

**Design possibility:** The player manually taxes wealthy agents while the exchange
process continues. A later comparison introduces an automatic structural redistribution
rule.

**Open questions:**

- Can manual intervention control inequality under any reasonable conditions?
- Which constraints make the game understandable without predetermining its result?
- Is the comparison about reaction time, targeting, policy consistency, or something
  else?
- What counts as winning: Gini, top share, a threshold duration, minimum wealth, or a
  combination?
- Where does collected wealth go?
- Does taxation alter incentives or only redistribute state in this model?

Do not tune the game to force a claimed lesson before testing it. If manual taxation can
win, that is a result. If it fails only under explicit constraints, those constraints are
part of the lesson.

Other possible harness presets include:

- a central banker with an interest-rate tool;
- a lobbyist using size bias or access as a weapon;
- a regulator;
- a neighborhood planner.

Each could lock different knobs and expose a different intervention without requiring a
new economic model. These remain prompts, not promised features.

One build-order intuition was that constraints create meaning: a focused mini-game may
teach better and be easier to build than a sandbox containing a wall of sliders. Under
that view, the full sandbox is the limiting case reached by gradually unlocking the
constrained shells. The opposite order may still prove better in the real codebase.

### Raw harness/core mechanism to retain

An early boundary sketch said: parameters in, economic events out, and a generic channel
for external interventions such as tax, inject, spawn, or remove. Scores, win conditions,
and the concept of "the player" would stay outside the simulation.

This is not yet an interface decision. Spawn and remove may conflict with fixed-size typed
state; an event stream may be unnecessary; and a generic intervention channel may become
too vague. Preserve the sketch because it names desired capabilities and a dependency
direction, then resolve the mechanics only when an experiment requires them.

---

## Mini-game: design a progressive tax system

This is a second, separate mini-game. It does not replace the point-and-shoot game; both
belong in the collection and teach through different kinds of action.

**Design possibility:** Give the player a live wealth distribution and let them design
progressive tax brackets or more complex tax rules. In this game the player's action is
structural: write the policy, start or resume the simulation, and watch the rule operate
automatically.

A visual bracket editor might let the player:

- drag thresholds directly across a wealth histogram;
- set a rate for each bracket;
- add or remove brackets;
- choose how often tax is assessed;
- decide where collected value goes;
- compare a simple rule with a highly tailored one;
- save a policy and test it against new random seeds or initial distributions.

More complex rule ideas to keep available:

- a continuous progressive curve instead of discrete brackets;
- a wealth tax, transaction-gain tax, flat tax, or negative tax;
- exemptions, allowances, floors, caps, and marginal versus effective rates;
- redistribution equally, toward the poorest, or through a common dividend;
- rules triggered by inequality, concentration, or an agent crossing a threshold;
- a limited number of brackets or a policy-complexity cost;
- delayed assessment, noisy information, or enforcement limits;
- rules that can be exploited by the simulated agents, if strategic behavior is ever
  introduced.

**Important model question:** Real progressive brackets usually tax income, while the
current Yard-Sale state records wealth and pairwise wealth changes. Taxing total wealth,
taxing a winning transaction, and taxing income are different models. The mini-game must
name which quantity exists instead of borrowing familiar tax language invisibly.

**Possible objectives and measurements:**

- keep the Gini coefficient below a threshold;
- limit the top wealth share;
- protect a minimum wealth floor;
- delay or prevent a concentration threshold;
- raise a target amount of revenue;
- preserve mobility or transaction activity;
- minimize tax collected while meeting an inequality goal;
- produce a rule that remains effective across unseen seeds;
- balance policy performance against rule complexity.

**Open questions:**

- Can a simple progressive rule outperform a complex rule across many runs?
- Will players overfit brackets to the current wealth distribution?
- Do discontinuous brackets create strange behavior even without strategic agents?
- Does the redistribution rule matter as much as the rates themselves?
- Is there a stable policy region or only temporary control?
- How sensitive is a successful policy to population size, stake fraction, topology, and
  assessment frequency?
- Should the player see one vivid run, aggregate results, or both?
- Could policies be tested blindly on held-out seeds like small scientific models?

One possible sequence across the two games is: manually chase rich agents, investigate
the limits of reaction, then enter the separate policy-design game and test whether an
apparently successful automatic rule survives new worlds. They could also appear
independently. The sequence is a narrative option, not a requirement that merges them
into one game.

Scientific limitation: unless incentives, labor, production, avoidance, mobility, and
other behavioral responses are explicitly modeled, this mini-game studies redistribution
inside a toy exchange process. It should not claim to forecast the effects of real tax
codes.

---

## Candidate seams worth remembering

These were originally written as future ADR seams, with no implementation implied:

- game to society: society hands the game a pair;
- game to individual: the game makes per-agent economic outcomes available and the
  individual decides how to display them;
- optional feedback: wealth to size to collision rate through one explicit coupling;
- harness to core: parameters and interventions enter, state or events leave, while
  scores, win conditions, and player identity stay in the harness.

The wording and even the boundaries may change. Their value here is that they record the
couplings we already know deserve deliberate treatment.

---

## Scientific standard for the whole piece

"Scientific" should describe the method and honesty of the explanation, not its visual
seriousness.

Candidate standards:

- publish the exact interaction and selection rules;
- separate assumptions, observations, and interpretations;
- use seeded randomness so runs can be reproduced;
- show repeated runs or distributions when outcomes vary;
- include controls that isolate each causal mechanism;
- measure effects rather than relying only on animation;
- distinguish toy-model behavior from claims about real economies or people;
- cite economic, physical, psychological, and visualization claims at their proper level;
- report unexpected and null results;
- make visual quantities honest, including whether radius or area carries a value;
- keep color and motion readable and accessible;
- label metaphors as metaphors and hypotheses as hypotheses.

The explorable should be allowed to ask questions whose answers surprise its author.

---

## Deferred possibilities

These may be valuable later but are premature while the agent is a placeholder circle:

- parametric faces generated from stable seeds;
- a small expression layer driven by the same abstract affect state as the circle;
- expression geometry or action-unit-grounded mappings;
- research into which facial regions carry different kinds of affect;
- an earlier research lead that the upper face may carry negative affect particularly
  strongly; this needs a source and careful interpretation;
- deliberate hand-drawn variation, jitter, caricature, or super-stimulus exaggeration;
- stable visual identity separated from temporary economic reaction;
- audio tied to agents or events;
- worker isolation or Rust/WASM;
- full sandbox controls;
- multiple language versions.

Recording an idea here preserves it. It does not create an obligation to build it.

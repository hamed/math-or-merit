# Ideas — Math or Merit? Concept Brief

Loose thoughts, questions, metaphors, interactions, and visual possibilities.

This is an idea/concept file, not a spec. It's meant to be opened in VS Code alongside
the repo, the existing ADRs, and the code, so a fresh agent can write or update ADRs
from it. That agent decides what's already decided by reading the repo — nothing here is
authoritative about current state.

What this file carries: **concepts, arguments, high-level algorithms, and the tensions
each idea resolves.** What it deliberately omits: variable names, file layouts, library
choices, framework specifics — those belong to the code, not the thinking. Where an idea
implies a mechanism, the mechanism is described only as far as the *concept* needs; the
exact implementation is the agent's to reconcile with the actual stack.

Rendering note: for now the per-agent visual is just a **placeholder circle**. Every
"face" idea below should be read as concept-level — it constrains what the eventual
display must be *able* to express, not what gets built first. A circle that can change
size/color/motion is enough to carry every claim here.

Three external architecture notes were discussed and are referenced by their character:
- **Note A** — argued for a single clean seam between *meaning* and *geometry*, with one
  small place that knows what sim-state means emotionally.
- **Note B** — argued for parametric generation from a seed (stable identity) plus a
  small expression layer, with deliberate hand-made imperfection; emphasized encoding
  *reaction*, not social category.
- **Note C** — argued for heavy compute isolation (worker/WASM). Judged over-built for our
  agent counts; the isolation *discipline* is worth keeping, the machinery is not.

---

## 1. The core cut: GAME / SOCIETY / INDIVIDUAL

The simulation separates into three concerns that must not bleed into each other:

- **The game** — the two-body rule. What happens when any two agents interact: the
  Yard-Sale exchange, the stake, the tax. Takes a pair, returns updated wealth. Knows
  nothing about *how* the pair met or *where* they are.
- **The society** — the matching topology. *How* pairs are selected: uniform random
  (mean-field), or embedded in a 2D plane where agents meet whoever they collide with,
  or a network, or a physical substrate. Decides *who meets whom*, never *what happens*.
- **The individual** — the display. Per-agent visual that reacts to what the game did to
  it and otherwise lives its own small life. Pure output; it never feeds back into game
  or society.

**Why this cut and not another.** An earlier slicing (space / economics / affect) fused
the rule and the topology into one "economics" blob. This cut is better because it makes
*swapping the substrate while holding the rule fixed* a first-class operation — and that
operation **is the entire thesis.** Fix the rule, change the society, watch condensation
appear in all of them: that's a universality argument in the statistical-physics sense
(the Ising transition doesn't care which lattice you use).

**The failure mode to guard against.** The game must never know its topology. The moment
the two-body rule branches on whether pairing is spatial or mean-field, the universality
claim collapses into "a model" and the whole argument is lost. This is the same
"special-case leaking into the generic waist" smell the project already fights elsewhere,
one level up.

---

## 2. Pluggable societies, including a physical substrate

The society slot takes different substrates with the *same* kernel plugged in:

- **Mean-field** — uniform random pairing. Standard Yard-Sale condensation: clean,
  analytically tractable, condenses onto a single agent.
- **Spatial 2D** — agents move in a plane and transact on collision. This introduces
  spatial correlation: you repeatedly meet neighbors, so wealth diffuses locally and you
  may see *domains* of condensation before a single global winner. Slower, structured.
- **Physical gas** — "atoms and stuff." This is **not a new model.** The Yard-Sale
  exchange is mathematically a kinetic-collision rule: two particles meet, redistribute a
  conserved quantity, separate. Money-as-energy kinetic models (Dragulescu–Yakovenko) give
  a Boltzmann/exponential wealth distribution from additive collisions; the multiplicative
  Yard-Sale variant breaks conservation just enough to condense instead of equilibrate.
  So the gas isn't an analogy — it's the literal physical system the econophysics was
  abstracted from. The faces were always particles wearing a social costume.

**The honest framing.** Don't claim "identical everywhere." Claim **"inevitable by
different roads."** The rule guarantees condensation; the society shapes its route —
mean-field condenses globally and fast, spatial forms domains then globalizes, gas
equilibrates or condenses depending on additive vs. multiplicative exchange. That's truer
to how universality actually works (same transition, substrate-dependent dynamics) and
it's a richer story than "same picture in every box."

---

## 3. Size-as-wealth: a second, independent condensation mechanism

If agent size scales with wealth, and collision probability scales with size, then bigger
agents transact *more often* — preferential attachment in the Barabási sense, stacked on
top of the exchange rule. The rich don't only win more per trade; they get more trades.

This is powerful and dangerous in equal measure:

- **The toggle is the single most important pedagogical control in the project.** A switch
  between uniform pairing and size-biased pairing lets the reader see that condensation
  happens *even with uniform pairing* — which defeats the obvious objection ("of course
  the bigger players accumulate") — and then watch it get *worse* when attachment turns on.
  This is the title, "Math or Merit?", made into a knob.
- **Lead with uniform pairing, not size-bias.** The uniform result is the rhetorically
  load-bearing one. Opening with size-bias hands a critic the "you built in rich-get-richer,
  no wonder" dismissal. Size-bias is the *additional twist*, never the headline.

**A control worth exposing as a deep parameter, not a buried constant.** The geometric
mapping (does wealth set radius, or area?) silently sets the exponent of the attachment
kernel, and that exponent selects the regime: roughly linear attachment gives a scale-free
power-law tail (Barabási–Albert class); sublinear gives no condensation onto a hub;
superlinear gives runaway winner-take-all (a Bose–Einstein-condensation-like grab of a
finite fraction by one agent). So the choice of how size encodes wealth *is* a choice of
which phase you're demonstrating. Expose it deliberately and you let the reader **cross the
condensation transition** — which is exactly the phase-transition framing the project's
unification thesis (photons / links / wealth as one transition) is built on.

**Containment.** Size-biased pairing is the one place economics feeds back into the
society (wealth → size → collision rate), closing a loop that's otherwise strictly
feed-forward. That feedback is desirable — it *is* the attachment mechanism — but it must
flow through a single, explicit wealth→size coupling and never leak into the spatial
substrate's internals. One quarantined coupling point, the same discipline as everywhere
else.

---

## 4. The individual: a life of its own, perturbed by events

The display is **semi-autonomous, not a readout of standing state.** It has its own
ongoing life (idle motion, the placeholder circle could pulse/breathe) and gets
*perturbed* by economic events.

**The key concept: affect is phasic, not tonic.** The wrong model is "poor agent looks
sad permanently, rich agent looks bright permanently" — that encodes *poor = sad* as a
social category, which is exactly what to avoid in a wealth-condensation argument, and
it's also just not how affect works. The right model: a *baseline* (slowly tracking
standing position) plus a *transient* that spikes on each event (loss, gain, tax) and
**decays back toward baseline** — a leaky integrator, a return-to-baseline relaxation.

So: "the economy doesn't make you sad; *losing a transaction* makes you wince, and then
you recover." This is both better science (real affect spikes to events and relaxes) and
a stronger argument (the room's asymmetry lives in the *event stream* — more
loss-events accumulating on one side — not painted onto static faces). The reader watches
condensation *emerge from the dynamics* rather than seeing it pre-labeled.

**Where the sim-meaning enters.** There should be exactly one conceptual place that knows
what a wealth-change *means* for the display (a loss is a negative-valence, high-arousal
event; a gain is positive; a tax is its own flavor). Re-framing the essay's rhetoric
(level vs. velocity, loss-aversion vs. gain) should be a change to *that one place* and
nothing else. (This is the spirit of external Note A's single meaning→geometry seam, and
external Note B's "encode reaction, not category.")

**On the affect model itself — carry this honesty into the ADR.** A two-axis model
(valence × arousal, Russell circumplex) fits because the sim naturally produces two
continuous quantities (wealth level → valence-like, magnitude of change → arousal-like).
But the dimensional-vs-discrete-emotion question is genuinely unsettled in the science;
the choice is "fits our data and minimizes parameters," not "scientific consensus." The
ADR should say that plainly rather than claiming the science certified it. (For a circle
placeholder, "valence" might just be color and "arousal" might be size or jitter — the
two-axis concept survives even with no face at all.)

**Engine boundary.** Whether the economy *emits* events or the display *infers* them by
diffing consecutive state is an open choice. Emitting is clean *if the economy already
computes the event internally* (the Yard-Sale rule inherently knows who won each pairing,
so the event already exists — emitting it isn't a leak, it's just not discarding
information). Diffing keeps the economy a pure state-emitter at the cost of the display
re-deriving what happened. Either way the economy never hears the word "face": the event
vocabulary is economic (lost / gained / taxed), never visual.

---

## 5. The end product: a sandbox, with mini-games as constrained shells

The finished piece is a rich sandbox where people play — make and break. But the sandbox
and any mini-game are the **same simulation core wrapped in different harnesses:**

- **Sandbox** = every parameter exposed, every intervention tool free, no goal.
- **Mini-game** = most parameters locked, one or two exposed as the player's action, plus
  a win condition and a score.

**The discipline: win conditions, scores, and the very notion of "the player" live in the
harness, never in the engine.** The moment the core knows it's being graded, mini-game
logic welds into the simulation and the sandbox inherits dead code — the same leak smell,
a different floor. The core exposes three things to the outside and only these: parameters
in, a stream of events out, and a generic "apply an external intervention to agent(s)"
channel (tax / inject / spawn / remove). The sandbox binds that intervention channel to
free tools; a mini-game binds it to one scored weapon. Build the channel once and new
mini-games are mostly UI over an unchanged core.

**The flagship mini-game — the tax agent — teaches by failure.** The player taxes the big
agents to keep society equal: point and shoot. The lesson, felt in the hands: *you cannot
win by reacting.* Condensation is continuous and structural; manual taxing is discrete and
slow; you bail a boat that refills by its own physics. Then the game reveals the real
lever — a *structural tax rate* already in the kernel — and suddenly inequality stabilizes
with no clicking. The player discovers, through play, that a structural problem needs a
structural intervention. This converts the thesis from something you *watch* into something
you *fail to beat by hand* and then *solve by structure.* Tune it so clicking genuinely
**cannot** win — the insufficiency of point-and-shoot is the teaching, not a balancing bug.

**Other mini-games are harness presets**, not new engines: a central-banker (interest-rate
tool), a lobbyist (size-bias as the weapon). Each is "lock different knobs, expose a
different tool."

A note on order without prescribing it: constraint creates meaning, so the constrained
shells (mini-games) tend to teach better and build easier than the unconstrained sandbox,
which is the *limiting case* where you stop locking knobs and which risks becoming a wall
of meaningless sliders if built first. The agent should sequence against the real repo.

---

## Honesty flags to carry into the essay copy and the ADRs

- Sell "**inevitable by different roads**," not "identical across substrates."
- The two-axis affect model is a **fit-for-our-data** choice, not scientific consensus.
- **Uniform pairing is the load-bearing default**; size-bias is the additional twist.
  Leading with size-bias invites the "you built in rich-get-richer" dismissal.
- Expression should encode **reaction to events**, never **social category** — no
  permanent rich-face / poor-face, no wealth/class/gender baked into identity.
- The **size↔wealth geometric mapping is a phase-selecting parameter**, not a cosmetic
  constant — treat it as a deliberate, exposed control.

## Concept-level seams the ADRs will need to name (no implementation implied)

- game ↔ society: the society hands the game a *pair*; that's the whole interface.
- game ↔ individual: the game produces *per-agent outcomes* (who won, who lost, who was
  taxed, by how much); the individual decides how to show them. Nothing flows back up.
- the one quarantined feedback: wealth → size → collision-rate, through a single coupling.
- the harness ↔ core boundary: params in, events out, interventions in — and nothing about
  scores, win conditions, or players inside the core.

## Deferred (premature while the placeholder is a circle)

The face-rendering apparatus discussed with external Notes A and B — parametric generation
from a seed, hand-made jitter for an authentic look, an action-unit-grounded mapping from
affect to facial geometry, the upper-face-carries-negative-affect finding, caricature/
super-stimulus exaggeration — is real and worth keeping, but none of it is needed until
the display moves past a circle. Recorded here so it isn't lost; not for an ADR yet.

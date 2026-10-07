# Affect, interpretation, and art direction

## Phasic display state

[Russell's circumplex](https://doi.org/10.1037/h0077714) is a research lead for organizing
affect concepts along pleasure/displeasure and arousal dimensions. It does not validate a
universal mapping from money to faces.

The research prototype therefore implements only an abstract display state:

- economic delta maps to a signed valence-like impulse and unsigned activation;
- impulses saturate and exponentially decay toward a neutral baseline;
- standing wealth does not define a permanent emotional identity;
- the state has no path back into the economy.

Before a face exists, circles must be tested for event legibility, overlapping impulses,
reduced motion, color-independent meaning, and misread emotional claims.

## Retrospective winner story

[Outcome-bias research](https://doi.org/10.1037/0022-3514.54.4.569) shows that known
outcomes can alter evaluation of otherwise identical decisions. The proposed interaction
also invokes attribution and storytelling, so it is not labeled a psychology
demonstration without a participant protocol.

Adjacent attribution evidence is not uniform enough to justify a universal claim.
[Frieze and Weiner (1971)](https://doi.org/10.1111/j.1467-6494.1971.tb00065.x) found
achievement cues could make success more likely than failure to receive internal
attributions such as ability or effort. A later
[experimental study of observed choices under uncertainty](https://pmc.ncbi.nlm.nih.gov/articles/PMC8477728/)
found the opposite asymmetry in its setting: good outcomes were attributed more to luck
than bad outcomes. Context and task structure matter.

Use arbitrary traits such as color, accessories, or idle timing. Do not use race, gender,
disability, facial morphology, or other social categories as merit cues. The safe framing
is: "Watch how easily a result invites a story."

The project therefore tests comprehension, not a named bias, using Study D in
[`reader-study.md`](reader-study.md). The pass condition is that readers understand both
that the traits were causally inert and that the explanatory trait was selected after the
outcome.

## Faces on the stage (2026-10-07)

The agents' faces (`src/lib/widgets/shared/face/`) draw a few authored moments: neutral,
the coin in the air, a win, a loss, pride and contempt. Each is a point in valence,
arousal and dominance, plus novelty for the startle, mapped to seven drawn features by
FACS-inspired synergies. These are drawing conventions readers recognise. They do not
claim to show what a person feels.
[Barrett et al. (2019)](https://doi.org/10.1177/1529100619832930) found facial movements
carry no universal emotional meaning. So reactions belong to scene events, not to standing
wealth, and nothing in the essay claims a face shows a felt state.

- **Points:** happy, sad, proud and surprised come from the
  [NRC VAD Lexicon v1](https://saifmohammad.com/WebPages/nrc-vad.html)
  ([Mohammad, 2018](https://aclanthology.org/P18-1017/)), rescaled from [0, 1] to
  [−1, 1]. They are word-meaning ratings, used as starting points for authoring.
- **Licence:** the lexicon is free for non-commercial research and educational use;
  commercial use needs a licence from the National Research Council Canada. If the essay
  is ever sold, license the four points or replace them with authored ones.
- **Contempt is authored:** the lexicon rates the word as unpleasant and low in dominance
  (v −0.59, a 0.27, d −0.21). The stage depicts contempt as cool superiority
  (v −0.35, a −0.2, d 0.65), following
  [Fischer & Roseman (2007)](https://crab.rutgers.edu/users/roseman/Fischer_%26_Roseman_2007.pdf),
  who found contempt colder and more distancing than anger. That study does not validate
  the exact point.
- **Tears** never follow from affect: sadness and boredom share coordinates, so a rule
  would make boredom cry. A scene may supply them explicitly.
- **Size and tempo** is an animation metaphor, not a finding. Blinks and glances slow
  with wealth, as (wealth/equal)^−0.25, after mammalian heart and breathing rates
  ([Stahl, 1966](https://pubmed.ncbi.nlm.nih.gov/6020227/)) and strides
  ([Heglund & Taylor, 1988](https://pubmed.ncbi.nlm.nih.gov/3193059/)). Neither study
  covers wealth or blinks. In primates, blink rate tracks group size rather than body
  weight ([Tada et al., 2013](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0066018)).

The prototype, with its fuller person model (temperament, dynamics, display rules), is
saved on the branch `faces-history`.

## Art-direction audit

- Record creator, work, link, license, and the specific quality being studied.
- Test reference-inspired principles rather than copying an illustrator's assets.
- Verify value encoding at actual scale: area and radius must be named honestly.
- Provide reduced motion and never make color the only event channel.
- Keep economic outcome separate from stable visual identity.

## Verdict

**Widget-only.** The phasic circle prototype is suitable for usability testing. No claim
about emotion, facial universality, or named cognitive bias enters the essay.

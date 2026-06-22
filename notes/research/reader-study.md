# Chapters I-III formative reader study

Small usability protocol for presentation questions that literature cannot settle. This
is product research, not a psychology experiment and not evidence about a population.

## Participants and handling

- Recruit 5-8 adults from the intended non-specialist audience.
- Prefer people who do not regularly work with statistics, economics, or data graphics.
- Do not collect names, demographic profiles, or sensitive data.
- Ask participants to think aloud; record task answers and observation notes only with
  consent.
- Test one person first and repair broken instructions before interpreting later sessions.

## Shared method

- Use project data and project-authored assets.
- Randomize A/B presentation order where two views are compared.
- Ask the task before asking which design the participant prefers.
- Do not explain a visualization until the task explicitly reaches its teaching step.
- Record wrong answers, hesitation, requests for clarification, and confident
  misreadings. Preference alone is not comprehension.

## Study A - Circle encoding

**Question:** Do area-scaled participants communicate order and change without pretending
to provide precise ratios?

Show wealth ratios `1:4:9` as area-proportional circles, first with 3 agents and then in
crowds of 20 and 100. Include the actual minimum-radius and overlap strategy proposed for
the widget.

Tasks:

1. Order three agents by wealth.
2. Identify which agent changed and whether wealth rose or fell.
3. Estimate whether the largest is about twice, four times, or ten times the smallest.
4. Locate the richest and poorest visible agents in each crowd.

**Pass condition:** every participant gets ordering and change direction right; at least
80% choose the correct ratio category and locate the extremes without relying on color.
If precise ratios fail, keep circles for change and add a common-axis chart or labels.

## Study B - Histogram versus cumulative view

**Question:** Which first distribution view answers the questions the chapter asks?

Animate the same seeded endpoint into (A) a stated-bin histogram and (B) an empirical
cumulative or Lorenz-style view. Counterbalance order.

Tasks:

1. Estimate how many participants hold less than half their starting wealth.
2. Decide which of two runs is more concentrated.
3. Find the approximate share owned by the richest participant.
4. Explain in one sentence what a bar or point means.

**Pass condition:** prefer a view only if it improves task accuracy or explanation, not
because it looks more polished. Default to the histogram for object continuity if results
are comparable; keep the cumulative view for Gini.

## Study C - Logarithmic scale

**Question:** Does the lesson produce multiplicative understanding rather than decorative
recognition?

Start with the same points on linear and base-10 logarithmic axes. Animate the
transformation, explain equal ratios, and isolate zero in a depleted bucket.

Tasks after the lesson:

1. State the ratio between adjacent positions labeled `1`, `10`, and `100`.
2. Place `30` between `10` and `100` without treating the interval as linear.
3. Explain why zero is not on the axis.
4. Compare two wealth values separated by two powers of ten.

**Pass condition:** at least 80% answer all four correctly without prompting. Otherwise
retain linear plus direct labels and remove log-based inference from the main path.

## Study D - Retrospective winner story

**Question:** Does the reveal expose post-hoc storytelling without teaching that visible
traits caused wealth?

Show traits before a seeded run, generate a winner story, reveal the actual causal inputs,
then rerun the same cast with another seed and another winner.

Tasks:

1. Before the reveal, ask what evidence supports the story.
2. After the reveal, ask whether any visible trait affected pairing, stakes, or wins.
3. Ask what changed between the two runs.
4. Ask the participant to describe the lesson in their own words.

**Pass condition:** every participant states that visible traits were causally inert, and
at least 80% describe the story as selected after the outcome. If participants infer a
claim about real demographic traits or a named psychological diagnosis, revise before
publication.

## Decision record

For each study, record prototype version, participant count, task results, recurring
misreads, the resulting design decision, and unresolved dissent. Add the summary to the
owning research memo; do not promote raw notes as general scientific evidence.

# Narrative sources and teaching claims

Source register for the topical hook, quotations, jokes, and short statistical lessons.
These sources support narrative details; they do not establish that the Yard-Sale model
caused any real person's wealth.

Publication-ready treatments and essay-safe wording are consolidated in
[`chapters-1-3-brief.md`](chapters-1-3-brief.md).

## Elon Musk trillionaire hook

- **Status:** Verified as a dated news hook.
- **Event:** Following SpaceX's June 12, 2026 public-market debut, news organizations
  reported that Musk's estimated net worth crossed one trillion US dollars, making him
  the first person reported above that threshold.
- **Sources:** [CBS News, June 12, 2026](https://www.cbsnews.com/news/elon-musk-spacex-ipo-trillionaire-wealth/),
  [Reuters, June 14, 2026](https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087).
- **Required qualifier:** This was an on-paper estimate dominated by priced equity and
  options, not one trillion dollars in cash. The value changes with asset prices.
- **Narrative use:** Topical opening and return point. Do not infer the causes, merit, or
  fairness of Musk's wealth from the headline or from the toy model.
- **Asset work:** Choose a headline treatment whose quotation, screenshot, image, and
  reuse rights are documented before publication.

## Spherical cow

- **Status:** Source tradition verified; exact script remains a design choice.
- [NASA astrophysicist Koji Mukai](https://asd.gsfc.nasa.gov/blueshift/index.php/2011/02/11/kojis-blog/)
  describes the spherical cow as a standard symbol of simplifying assumptions and warns
  against forgetting the approximation's limits.
- The source pass found multiple cow, chicken, horse, farmer, biologist, and physicist
  variants. It did not establish a canonical chemist-versus-physicist version containing
  the exact "sphere in a vacuum" punchline.
- Write a short project-authored paraphrase rather than presenting one circulating
  version as an attributable quotation.
- The teaching claim is modest: idealized models remove detail to isolate a mechanism.
  Failure or success in a toy model does not automatically transfer to every richer
  model.

## Merit and hustle material

- **Status:** Core framing supported; publication treatment remains open.
- A [book excerpt published by the Harvard Gazette](https://news.harvard.edu/gazette/story/2021/01/the-myth-of-meritocracy-according-to-michael-sandel/)
  supports the exact thematic bridge: winners can interpret success as proof of talent
  and hard work while overlooking assistance, circumstances, and good fortune. Use a
  short quotation only after checking the chosen edition and page; otherwise paraphrase
  and cite the excerpt.
- Michael Young's [2001 retrospective essay](https://www.theguardian.com/politics/2001/jun/29/comment)
  is valuable cultural history: *The Rise of the Meritocracy* was satire and warning,
  not an endorsement of a credentialed ruling class. It predates Sandel and can keep the
  essay from treating criticism of meritocracy as one author's invention.
- Contemporary [CBS coverage](https://www.cbsnews.com/news/teslas-elon-musk-likes-80-hour-workweeks-science-says-forget-it/)
  records Musk's November 2018 posts that world-changing work requires more than a
  40-hour week and that roughly 80 sustained hours, sometimes over 100, may be needed.
  The original posts are identifiable as
  [the 40-hour claim](https://twitter.com/elonmusk/status/1067173497909141504) and
  [the 80-to-100-hour reply](https://twitter.com/elonmusk/status/1067175527180513280).
  This is a real and unusually relevant hustle-culture example. Use an embed only after
  checking platform behavior and publication rights; otherwise create a clearly labeled
  text treatment rather than a fake screenshot.
- The [ILO's 2022 global working-time report](https://researchrepository.ilo.org/esploro/outputs/report/Working-time-and-work-life-balance-around/995264841602676)
  reports that more than one-third of workers regularly work over 48 hours a week. Its
  [working-poverty data](https://ilostat.ilo.org/blog/those-left-behind-the-forgotten-in-the-fight-against-global-poverty/)
  also show that employment and even multiple jobs do not universally lift households
  above international poverty lines.
- **Essay-safe contrast:** "Long hours are common, and working poverty still exists."
  Do not turn those aggregate facts into a causal claim that effort never affects an
  individual's outcome.

## Statistical teaching checks

### Histogram

- [Freedman and Diaconis](https://statistics.stanford.edu/technical-reports/histogram-density-estimator)
  formalize histogram bin-width selection as a density-estimation problem. This supports
  the warning that bin width is an analytical choice, not a neutral container.
- Define the bins and show that changing bin width or boundaries can change the apparent
  shape.
- A cumulative empirical view avoids bins but is less culturally familiar. Compare both
  presentations with ordinary readers before choosing; literature alone does not answer
  which one best serves this story.
- Moving agents into bins is a design explanation, not evidence about a distribution
  family.

### Logarithmic scale

- Teach powers of ten before the axis appears in an analytical chart.
- "Count the zeros" is an entry point for exact powers of ten, not a complete definition.
- [Ryan and Evers](https://doi.org/10.1177/237946152000600203) found that lay readers
  shown logarithmic rather than linear epidemic graphs made less accurate growth
  predictions; explaining the scales reduced but did not eliminate the effect. A brief
  label is therefore insufficient. Use a side-by-side transformation and a small
  comprehension check before asking the reader to infer anything from the log view.
- Zero has no logarithm. The view must state how exact or floating-point zeros are
  omitted, floored, or displayed separately.
- A straight-looking log plot is not evidence of a power law. Clauset, Shalizi, and
  Newman's [statistical framework](https://arxiv.org/abs/0706.1062) requires parameter
  estimation, a goodness-of-fit test, and comparison with alternatives. With the current
  baseline, omit the power-law claim rather than making the log lesson carry it.

### Gini coefficient

- Use the finite-population definition already recorded in `protocol.md`.
- Equal wealth gives `0`; with `N` non-negative agents and one owner, the project metric's
  maximum is `(N - 1) / N`, not exactly `1`.
- A realized Gini may fall on an individual trade even though the asymptotic baseline
  condenses.

### Circle size

- If a circle claims to encode wealth quantitatively, make its **area** proportional to
  wealth, so radius is proportional to the square root of wealth. Radius proportional to
  wealth makes area proportional to wealth squared and exaggerates the ratio.
- Cleveland and McGill's
  [graphical-perception experiments](https://doi.org/10.1080/01621459.1984.10478080)
  place area below position and length for accurate quantitative comparison. Circles can
  carry the embodied story, but a histogram, labels, or metrics should provide the more
  auditable comparison.
- Perceptual evidence does not choose the minimum visible radius, crowding behavior, or
  maximum size cap. Those require a prototype at the actual population sizes.

## Model-claim routing

- Stake sensitivity and finite-time calibration belong in `baseline.md` and
  `results.md`.
- Levy, redistribution, and progressive-rule claims belong in `interventions.md`.
- Physical analogies belong in `physical-analogy.md`.
- Wealth-to-size and encounter-frequency claims belong in `wealth-size-access.md`.
- Subsistence, passive return, money supply, and parameter-map proposals remain in
  `../ideas.md`; literature leads and definition gates live in `extensions.md` until exact
  models exist.

## Cultural-reference rule

Current cultural anchors are the spherical-cow tradition, Young's satirical origin of
"meritocracy," Sandel's critique, Musk's hustle posts, and the trillionaire news event.
No film or fictional scene is selected yet. Add one only when it performs a named job in
the narrative; resemblance to wealth or class is not enough. Record creator, work, date,
exact scene or line, context, and quotation or clip rights before use.

For the current arc, use project-authored text cards and visuals only. This closes the
immediate rights question without setting a permanent ban on later sourced material.

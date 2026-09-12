# Current state and development handoff

Updated 2026-09-12. This is the operational entry point for the next development
session. It records what is live, what is pending, and which source owns each kind of
decision. It does not replace the narrative outline, evidence ledger, or git history.

## Read in this order

1. [`outline.md`](outline.md) — approved argument, narrative order, and deferred ideas.
2. [`prose.md`](prose.md) — the editable reader-facing script, tagged for reintegration.
3. [`research.md`](research.md) — claim status, limitations, and essay-safe wording.
4. This file — branch, release, and next-work status.

Use [`draft-decisions.md`](draft-decisions.md) and [`storyboard.md`](storyboard.md) as
historical provenance. They contain superseded intermediate states and are not current
roadmaps.

## Product state

The guided essay now has a complete end-to-end experience before the sandbox:

- a timed director's opening and spherical-cow model lesson;
- a reversible, step-driven fair-trade lesson, prediction, authentic fresh run, and
  retrospective winner newspaper;
- histogram and log-ruler teaching, visual Gini teaching, an interactive
  effective-participants lesson, ordinary turnover, a larger-room run, the long-run
  theorem, and the stake dial;
- a manual targeted levy game, a separate structural levy-plus-equal-return lesson,
  matched rooms, and a finite-outcome map;
- an earned conclusion followed by the full sandbox laboratory.

The core human argument is stable: equal agents, equal starts, random partners, the same
poorer-fortune stake rule, and a fair coin still produce condensation. Money does not
improve the odds; it provides staying power. A proportional wealth levy plus equal social
return can keep meaningful participation and ordinary turnover open inside this model.

Effective participants is the primary intuitive measure. Gini is still taught and remains
available as the technical alternative. Ordinary turnover excludes levy and return flows.
The outcome map is finite, measured evidence—not a phase transition or a universal tax
law.

## Git and review state

- `main` is at `5d285d2`, the merge of PR #17, **Keep the field open**.
- Branch `feat/phase11-laboratory-handoff` is at `d31d686`.
- PR [#18](https://github.com/hamed/math-or-merit/pull/18), **Finish the laboratory
  handoff**, is open, reviewed, and mergeable. It aligns laboratory terminology, restores
  current sandbox visual baselines across desktop and both phone orientations, and keeps
  Gini available.
- The last recorded PR #18 verification was 231 unit tests, clean Svelte/TypeScript
  checks, and 4 visual tests. One of 39 browser tests hit the known load-dependent manual
  intervention timeout and passed repeatedly in isolation.
- The working tree also contains owner-controlled `.gitignore`, inbox, art-source, review,
  and editor/tooling files unrelated to PR #18. Preserve them; do not stage or clean them
  as part of another task.

## Release state

GitHub Pages is public at <https://hamed.github.io/math-or-merit/>. It currently serves the
last successful deployment, from PR #16 (`ab60b4a`), not current `main`. The PR #17 Pages
run failed before building the artifact because the browser test for the deferred cow
scene timed out while waiting for its marker; 38 other browser tests passed. The existing
published copy remains available.

The blank page reported on 2026-09-12 was the stale local browser shell while no Vite
server was listening on port 5173. Starting the server and loading
`http://127.0.0.1:5173/` rendered the current branch without a JavaScript runtime error.
Local development servers are session processes, so a future session must start one
again with `npm run dev`.

Before calling the next release complete:

1. merge PR #18;
2. make the Pages workflow pass or rerun it after confirming the browser timeout is not a
   product failure;
3. inspect the published URL in desktop and phone portrait/landscape, including a deep
   link and a reverse-navigation path.

## Next work

The next creative pass is primarily the author's voice pass in [`prose.md`](prose.md).
The visual and interaction spine is already present. Rewrite or cut freely while keeping
the tags and load-bearing claim notes. The target is spoken, personal, playful, concise,
occasionally provocative, and recognizably Hamed—not generic explanatory prose.

Once a prose section is approved, the implementation task is deliberately local:

1. move the approved tagged lines into the essay, scene captions, or owning widget;
2. tune that section's pauses and transitions around the finished words;
3. verify forward and reverse wheel, keyboard, and touch behavior on desktop, portrait,
   and landscape;
4. update only the visual baselines intentionally changed by that section.

Do not redesign the engine, simulation state, widget contract, or sandbox while doing the
voice pass.

## Guardrails that remain in force

- Reader-facing runs use fresh randomness. A completed run is stored for reversal; an
  explicit new run draws again.
- Do not add UI validation merely to prevent zero, negative, or otherwise experimental
  sandbox values. Preserve arbitrary finite expert inputs and handle malformed structure
  only at persistence boundaries.
- No guided argument follows the sandbox. Only methods, references, credits, public links,
  and clearly separated support material may follow it.
- The manual game targets a chosen holder. The structural rule levies every fortune by the
  same percentage and returns the pool equally. Never describe one as the automated form
  of the other.
- Navigation must never hard-lock the reader. Forward input may complete a required beat;
  reverse input must undo the stored presentation rather than invent new randomness.
- Keep reader-facing claims inside the evidence language in `research.md`. In particular,
  do not restore phase-transition framing, GDP language, or real-policy conclusions.
- Repository files, commit messages, PRs, reviews, and deployment logs are public surfaces.
  Record only project-relevant context approved for publication; do not publish private
  biographical or conversational details.

## Deferred tracks

These remain possible developments, not work silently implied by the next task:

- final slogan and remaining motif payoffs;
- recorded narration, accessibility audio, and a standalone video after the script settles;
- shareable run/result artifacts and section-level navigation;
- post-sandbox methods, references, public profile links, disclosed support/affiliate
  links, and approved merchandise;
- progressive taxation after a separate literature and mechanism review;
- scalar rank mobility after its horizon and near-zero churn problem are resolved;
- Persian translation and final RTL polish;
- backend aggregation, collective maps, analytics expansion, or exact arbitrary-history
  replay.

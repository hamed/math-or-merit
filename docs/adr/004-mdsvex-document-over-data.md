# 004 — mdsvex document over data-manifest

## Status
Accepted (amended 2026-06-23 — see Amendment below; decision unchanged)

## Context
The piece is prose-dominant and English-first: a written essay with interactive widgets dropped into the flow. We could model it as a data manifest (a list of content units assembled by code) or as a document (prose written inline with components). The two differ in where authoring happens and how translation works.

## Decision
Use mdsvex: write the essay inline in `.svx` files with widgets dropped in flow. The file's order *is* the manifest — no separate assembly step. Translate at *document grain* (a parallel `.svx` per locale, e.g. `intro.fa.svx`) if languages happen, not at string grain. Paraglide handles only UI chrome (buttons, labels), never essay prose.

## Consequences
- Authoring is writing — the natural mode for a prose-dominant piece — and the document order is self-evident.
- Translation is a parallel document, not a thousand extracted strings; this matches how an essay is actually re-authored in another language.
- Editing English orphans its translations by design — accepted, because we translate last, after English settles (see translation discipline in CLAUDE.md).
- Paraglide stays scoped to chrome, so UI strings and essay prose don't get tangled into one machinery.

## Amendment (2026-06-23) — stage-aware writing stance under consideration

A "stage / location" presentation model is being explored (see `notes/draft-decisions.md` D8): one persistent canvas that holds the visual in a fixed place and morphs there, with narration arriving and leaving in chunks over it — rather than a column scrolling past a pinned graphic. It is recorded here so this boundary stays honest, because it touches two parts of the decision above.

Tensions:
- **"Prose-dominant":** a persistent canvas with transient text is closer to co-equal text and visual. Product character may shift; keep the meaning in the words regardless.
- **"The file's order *is* the manifest, no separate assembly step":** if a *beat* becomes a unit of **authoring** (text + canvas-state packaged together), that reintroduces a manifest and reopens this ADR.

**Not overturned.** The current draft preserves this ADR: prose is still authored inline in the `.svx`, and the stage is expressed only as soft, in-document `CANVAS →` cues plus one `stage` figure — no manifest, no assembly step. The beat is, for now, a unit of *presentation* only.

**Open question (the hinge):** is the beat a unit of **authoring** or only of **presentation**? Presentation-only keeps this ADR shut; authoring-grain beats reopen it.

**Revisit when:** code needs to lift the canvas/timeline out of the document, or a beat-grained authoring format is proposed — likely a new ADR (013 — stage, locations, and timeline) rather than an edit here. Any such stage layer remains bound by the engine/content and widget guards (ADR 001, ADR 005). Until then the decision stands.

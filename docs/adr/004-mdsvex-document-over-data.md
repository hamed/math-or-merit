# 004 — mdsvex document over data-manifest

## Status
Accepted

## Context
The piece is prose-dominant and English-first: a written essay with interactive widgets dropped into the flow. We could model it as a data manifest (a list of content units assembled by code) or as a document (prose written inline with components). The two differ in where authoring happens and how translation works.

## Decision
Use mdsvex: write the essay inline in `.svx` files with widgets dropped in flow. The file's order *is* the manifest — no separate assembly step. Translate at *document grain* (a parallel `.svx` per locale, e.g. `intro.fa.svx`) if languages happen, not at string grain. Paraglide handles only UI chrome (buttons, labels), never essay prose.

## Consequences
- Authoring is writing — the natural mode for a prose-dominant piece — and the document order is self-evident.
- Translation is a parallel document, not a thousand extracted strings; this matches how an essay is actually re-authored in another language.
- Editing English orphans its translations by design — accepted, because we translate last, after English settles (see translation discipline in CLAUDE.md).
- Paraglide stays scoped to chrome, so UI strings and essay prose don't get tangled into one machinery.

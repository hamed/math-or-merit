# ADR-019 — One LaTeX script for every word

Date: 2026-09-27
Status: **ACCEPTED 2026-09-27 by the owner** (brief `merit-or-math-script-format.md`,
2026-09-26, grammar v0 approved; v0.1 changes approved 2026-09-27).
Supersedes `notes/prose.md` as the owner's editing surface. Will amend ADR-017's
A2 (dialogue as Paraglide messages) at the switch; until then it stands.

## Context

The words lived in `notes/prose.md`; their order, waits and actions lived in the
pair stage's step list (`scenes/pair/script.ts`) and a dozen special cases in
`PairScene.svelte`. The owner edits words, but sequence and timing are story
decisions too, and they sat where only an agent could change them. Two files
described one story, and a test kept them from drifting.

## Decision

1. **`script/` is the single source of the story's words, order and timing**,
   in plain LaTeX, linear in time: `script.tex` (the timeline, acts made of
   numbered scenes, every alternative written where it plays as a conditioned
   bubble), `branches/`, `decl.tex`, one folder per language. Cards and widgets
   are **units**, one file each, that don't know what they are: `\card{gini}`
   drops `cards/gini.tex` as a card and the PDF draws it there; the widgets'
   words print at the back. The grammar is `script/GRAMMAR.md`, a contract:
   changes go to the owner.
2. **The PDF is how the owner reads it.** LuaLaTeX, because a Lua line filter
   (`render.lua`) draws bubbles and directions from the plain source without
   adding markup to it, and because babel's right-to-left support is built for
   LuaTeX. `npm run script:watch` rebuilds on save (≈3 s). Built in CI, never
   committed.
3. **The parser is TypeScript, headless, no dependency** (`src/lib/script/`),
   runs under plain Node in ≈80 ms, and never needs LaTeX. Lint runs before
   every PDF build: a script that breaks the grammar makes no PDF, so LaTeX and
   the parser never silently disagree.
4. **The skeleton** (structure labels, actions, choice targets) is identical in
   every language; words between skeleton points are free.
5. **Phased.** First the script reproduced the running game exactly (a
   bridge, `script:diff`, proved 155/155 steps and 295/295 messages). Then,
   2026-09-27, **the switch**: the build reads the script — words, order and
   waits. `src/lib/script/compile.ts` turns it into `messages/en.json` and
   `src/lib/content/story.gen.ts`; the pair stage builds its steps from the
   story, finding the few steps it addresses by name by what they do
   (`ROLES`). Acceptance: the steps built from the script equal the
   hand-written ones field for field (152 poses, waits, actions, lines, flags,
   logs; every event line), 21/21 browser tests, and a line edited in the
   `.tex` shows on the stage 3.4 s after the save.

## Consequences

- `notes/prose.md` is retired (kept for its appendix); its pipeline
  (`prose.ts`, `prose-to-messages.ts`) and the bridge (`script-game.ts`,
  `script:diff`) are deleted.
- The stage's special steps are named by `ROLES`; a test fails when an edit
  leaves one without a step or with two. Scroll scenes (the cow, the human)
  keep their beats in code (`CAPTION_BEATS`).
- The dev server recompiles on save and the page reloads (3.4 s save to
  stage, over the brief's 2 s: Paraglide's messages reload the page rather than
  hot-swap). Formulas render with KaTeX, loaded only with a card that has one.
- Farsi: the stage's steps are built from the English script, so a translation
  can't yet change the number of bubbles; `messages/fa.json` is not compiled.
  `\gls` links show in the PDF; on the web the words show without the link.
- Where the code does something the grammar can say only loosely — the
  four-person readout (`interrupts`) — the script names it and the code keeps
  the how.
- Words still in code, outside both prose.md and the script: the morning
  paper's headlines (`frontPageFor`, `headlineForStyle`), and the axis words of
  the sandbox plots drawn on the cards (`LorenzPlot`, `Histogram`). The
  headlines move into a pool at or after the switch.
- A compound condition is a lint error that goes to the owner, who
  then decides between a real narrative language and logic in code with a
  readable summary in the PDF.

## Later (from the brief, not built yet)

Per-language steps (Farsi's own bubbles), jumping to the edited panel on save,
a hot swap instead of a reload, stamped panel thumbnails in the PDF,
translations carried over by matching text, `\gls` as a tap on the web. Later
still: the static HTML transcript (the no-JS fallback), voice-over, Beamer
slides, share cards, the bibliography, styled PDF bubbles.

## Alternatives rejected

- **Keep prose.md + step list.** The owner can't change order or timing
  without an agent.
- **XeLaTeX.** No input hook: bubbles would need `\obeylines` tricks or markup
  in the source.
- **HTML → PDF from the parser.** One parser and no TeX, but loses SyncTeX,
  the todo list, the glossary and the bibliography; the owner chose LaTeX.

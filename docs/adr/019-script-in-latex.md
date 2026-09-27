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
   in plain LaTeX, linear in time: `script.tex` (the timeline), `pool.tex`
   (lines picked by what happened, reactions, cards), `branches/`, `decl.tex`,
   one folder per language. The grammar is `script/GRAMMAR.md`, a contract:
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
5. **Phased.** First the script reproduces the running game exactly
   (`npm run script:diff`: 153/153 steps, 19/19 pool sections, 295/295 messages
   at acceptance), and the owner edits it through the PDF. The build keeps
   reading `messages/en.json` and `script.ts` until the owner says the PDF is
   right; then **the switch**: the build reads the script, words first, then
   order and timing.

## Consequences

- `notes/prose.md` is frozen: it still feeds the build until the switch, but it
  is not edited. After the switch it goes.
- `scripts/script-game.ts` and `script:diff` are a bridge that knows the step
  list and the scene's special cases; they go at the switch.
- Where the code does something the grammar can say only loosely — the tax
  game's result spoken inside "Start" (`\pick{game}` as a cue), the four-person
  readout (`interrupts`) — the script names it and the code keeps the how.
- Words still in code, outside both prose.md and the script: the morning
  paper's headlines (`frontPageFor`, `headlineForStyle`). They move into the
  pool at or after the switch.
- A compound condition in the pool is a lint error that goes to the owner: he
  then decides between a real narrative language and logic in code with a
  readable summary in the PDF.

## Later (from the brief, not built yet)

At the switch: `script.json` per language, the no-drift test (every bubble on
stage comes from the script, every script id is used), the live stage (save a
`.tex`, see it on stage in under 2 s, jumping to the edited panel), stamped
panel thumbnails in the PDF, translations carried over by matching text. Later
still: the static HTML transcript (the no-JS fallback), voice-over, Beamer
slides, share cards, the bibliography, styled PDF bubbles.

## Alternatives rejected

- **Keep prose.md + step list.** The owner can't change order or timing
  without an agent.
- **XeLaTeX.** No input hook: bubbles would need `\obeylines` tricks or markup
  in the source.
- **HTML → PDF from the parser.** One parser and no TeX, but loses SyncTeX,
  the todo list, the glossary and the bibliography; the owner chose LaTeX.

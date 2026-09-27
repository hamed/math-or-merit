# The script grammar (v0.1)

Every word the reader sees lives in `script/`, in plain LaTeX that a person
reads first and a small parser reads second. This file is the contract between
the two (ADR-019). Changing it goes back to the owner.

**Build.** `npm run script:watch` rebuilds `script/out/main.pdf` (and
`main-fa.pdf`) on every save, in about 3 seconds; keep the PDF open in an
editor tab and it refreshes. `npm run script:pdf` builds once. Lint runs first:
a script that breaks this grammar makes no PDF, and the error names its file
and line. `npm run script:lint` lists the warnings too; `npm run script:diff`
lists how the script differs from the game that is running now.

## Files

| File | Holds |
|---|---|
| `main.tex` | the PDF's style, and the order the files are read in |
| `decl.tex` | speakers, facts, events, timing |
| `script.tex` | the timeline: every bubble, action and choice, in order |
| `pool.tex` | lines picked by what happened, reactions to events, the cards |
| `branches/*.tex` | side trips a choice opens (the cow, the spherical human, all the dials) |
| `fa/…` | one folder per language, same file names |
| `render.lua` | draws the plain paragraphs for the PDF; never needed by the app |

## 1. Paragraphs

A paragraph is the text between blank lines. How it starts says what it is:

| Starts with | It is |
|---|---|
| `Name:` or `Name (manner, …):` — a declared speaker | a **bubble**; each later line is a line break |
| `\` and an action | an **action** paragraph, one action per line |
| `\section` / `\subsection` + `\label{…}` | **structure**: an **act** / a **scene** |
| `\begin{description}` | **UI strings**: `\item[key] words` |
| `\begin{figure}` | a **figure** |
| anything else | a **stage direction**: for readers and screen readers, never a bubble |

- `%` comments sit on their own lines: notes for agents and history. Never output.
- **One paragraph is one step** of the stage. A bubble is a step; an action
  paragraph is a step.
- **The talk clears at every act** (`\section`). A scene (`\subsection`) is a
  heading inside the act; the talk goes on across it.

### 1.1 Lines inside a bubble

```latex
Red: Yes. And I'll match that.     % words: this line and the next are the bubble
\stake{2}                          % a cue: plays as the bubble arrives
\todo{draft}                       % attachments: notes on the bubble
\marginpar{The stake is half of the poorer fortune, every round.}
```

- A line holding only `\label`, `\marginpar`, `\todo` or `\adapt` **attaches**
  to the bubble. It is not a line of words.
- A line holding an action is a **cue**: it plays as the bubble arrives. A
  reader action as a cue (`\meet{red}`) makes the bubble wait for the reader.
- Put words first, then cues, then attachments.

### 1.2 Variants

A bubble can hold a list where its lines would go. The reader sees one item at
a time.

```latex
Red (aside, brief):
\begin{enumerate}     % in order: first, then the next each time the stage nudges
  \item Hi.
  \item Hello?
\end{enumerate}
\meet{red}
```

`enumerate`: in order; the last one repeats. `itemize`: any order, picked by
the stage. A list right after an action line is that action's body (the
title's reel: `\reveal{math}` and its words). A list anywhere else is an error.

## 2. Speakers and manner

`decl.tex` declares `\speaker{id}{Name}`. Each language names the same ids its
own way (`fa/decl.tex`: `\speaker{red}{قرمز}`). The name is also what the build
shows as the speaker's name. A name that isn't declared is an error.

Manner words, in the parentheses, stay English in every language:

| Manner | Means |
|---|---|
| *(none)* | a key line: waits for the reader |
| `flow` | chit-chat: moves on by itself once read |
| `aside` | said to the reader, not to the other one |
| `brief` | goes as soon as anyone says the next thing |
| `teletype` | typed out, moves on by itself |
| `interrupts` | appears beside the bubble before it |
| `thought`, `wait` | reserved |

Any other word is kept as a delivery hint, with a warning.

## 3. Words

Inside words, only these: `\emph{}`, `\textbf{}`, `{\large …}`, `{\Large …}`
(said louder), `$…$` (math), `\val{name}` or `\val{name}{example}` (a live
value), `\plural{one}{many}`, `\gls{id}`, `\footnote{}`, `\cite{}`, `\ref{}`,
and the escapes `\% \$ \& \# \_ \{ \} ~ -- ---` ``` ``…'' ```.

Notes: `\todo{…}` (not the owner's words yet), `\marginpar{…}` (a claim that
must stay true), `\adapt{…}` (a note to the translator: exported with the text,
printed in the margin, never shown to readers or read aloud).

Anything else is an error, never a guess. Lint catches a bare `%` and a `$`
before a digit.

## 4. Actions

Code owns this list. An action is **authored** (it plays, then the script goes
on) or **reader** (it waits for the reader; the wait is never written).

| Action | Does |
|---|---|
| `\reveal{x}` / `\hide{x}` | shows or takes away a thing: `headline`, `merit`, `or`, `math`, `mark`, `coins`, `coin`, `words`, `card:<id>`, `curve`, `diagonal`, `gap`, `lorenz`, `map`, `fit`, `toy:<id>` |
| `\crowd{x}` | the crowd: `idle`, `payout`, `two`, `room`, `empty` |
| `\stake{n}` | each puts n coins on the table |
| `\flip{side}` | the coin lands on `blue` or `red`; the result is logged |
| `\run` / `\run[longer]` / `\run[game]` | the room plays; played on; the tax game |
| `\arrange{x}` | the room stands as `piles`, `ruler`, `line`, `equal`, `zero`, `double`, `half`, `one`, `four`, `turnover`, `levy4`, `free` |
| `\control{x}` | the reader holds `stake`, `tax`, `sandbox`, or `none` |
| `\levy{x}` | the lesson's pool: `collect`, `return` |
| `\match` | the room and its mirror, on the same luck |
| `\card{id}` | drops a concept card into the stack |
| `\pin{id}` | pins the concept's picture to the side rail |
| `\meet{who}` | *reader*: clicks the circle |
| `\equalize` | *reader*: moves coins until 8 and 8 |
| `\choice{words}` | *reader*: a choice; see below |
| `\pick{group}` | plays the first pool section labelled `group:…` whose `\when` holds |
| `\pause` / `\pause[n]` | n beats |
| `\return` | back to where the branch was opened |
| `\expect{blue=4, red=12}` | **checks** the state after the step (never sets it) |
| `\params{k=v, …}` | sets a setting (`speed`, `stake`, …), never who owns what |
| `\keep{n}` | at most n bubbles on screen |

`\expect`, `\params` and `\keep` never make a step: they belong to the step
they're in.

**Choices.** `\choice{words}{target}`, one per line; consecutive choices are one
group. The target says what the choice does:

| Target | Does |
|---|---|
| *(none)*: `\choice{Go on}` | goes on |
| a section or scene label: `{cow}` | jumps there |
| `fact=value`: `{bet=coffee}` | records the answer; the bubble waits for it |
| an action: `{\run}` | does it |

Jump targets are structure labels only: a translation may merge bubbles, so a
bubble label is not in every language.

## 5. Pool, facts, events

`decl.tex` declares `\facts{…}` and `\events{…}`. A pool section is a small
scene with exactly one condition:

```latex
\section{They react: Red passes eight}\label{react:red-above-eight}
\on{red-above-eight}

Blue (flow): Whoa. Equal, not upside down.

Red (flow): Tempting. But give him one back.
```

`\when{fact=value}` for what happened, `\on{event}` for a moment. **The
tripwire:** a compound condition ("and", "or", a comparison) is a lint error and
goes to the owner. Pool sections without a condition hold timeless material:
the cards, as UI strings.

## 6. Timing

`decl.tex` holds the only absolute numbers: `\beat{0.6s} \perword{0.4s}
\minread{1.5s} \nudge{4s}`. A key line waits; `flow` shows for
`max(minread, words × perword)`; `\pause[n]` is n beats. The script says what
happens and when, never how: coordinates, colours, easing and animation lengths
stay in code.

## 7. IDs, skeleton, translation

- A bubble's id is `<label>.<n>`: the nearest act or scene label, n counting
  bubbles only. The PDF prints it at the end of the bubble.
- **The skeleton** is the structure labels, the actions with their arguments,
  and the choice targets. It is identical in every language; between two
  skeleton points the words are free (Farsi may use two bubbles where English
  uses one).
- UI strings keep their keys (`\item[log.toss]`) in every language.

## 8. Lint

Errors: an undeclared speaker, fact or event; a command outside the grammar; a
bare `%`; a `$` before a digit; a section or scene without a label; a label used
twice; a compound condition; a choice target that is none of the four; a list
outside a bubble or an action; more than 18 words in an English bubble; a
translation whose skeleton differs from English. Warnings: more than 12 words;
an unknown manner word.

## Changes from v0 (the brief of 2026-09-26)

Proposed and accepted in v0.1: attachment lines (1.1); variants (1.2); `\adapt`;
manner words stay English; `\expect` checks and `\params` never sets holdings;
jump targets are structure labels; `\pick{group}`; pool sections are small
scenes; `\nudge`; bubble numbers count bubbles only; LuaLaTeX.

Added while transcribing the running game: one paragraph is one step, and
action lines in a bubble are its cues; the talk clears at acts, not scenes;
the manners `brief` and `interrupts`; choice targets beyond a label (go on, an
answer, an action); the story's action list (§4).

# The script grammar (v0.1)

Every word the reader sees lives in `script/`, in plain LaTeX that a person
reads first and a small parser reads second. This file is the contract between
the two (ADR-019). Changing it goes back to the owner.

**The game reads the script.** With `npm run dev` running, saving a `.tex`
file recompiles the words, the order and the waits into the game
(`messages/en.json`, `src/lib/content/story.gen.ts`), and the page reloads on
the step you were reading. A script that breaks the grammar changes nothing:
the game keeps the last good version and the error shows on the page and in
the terminal.

**The PDF.** `npm run script:watch` rebuilds `script/out/main.pdf` on every
save; keep it open in an editor tab and it refreshes. Its side panel lists every
act, scene and card. `npm run script:pdf` builds English and Farsi once. Lint
runs first here too. `npm run script:lint` lists the warnings as well.

## Files

| File | Holds |
|---|---|
| `script.tex` | **the timeline**: every bubble, action and choice, in the order it plays |
| `branches/*.tex` | side trips a choice opens (the cow, the spherical human, all the dials) |
| `cards/<id>.tex` | one concept card per file |
| `widgets/<id>.tex` | one widget per file: the words on its buttons, axes and labels |
| `decl.tex` | speakers, facts, events, timing |
| `main.tex` | the PDF's style, and which files it reads in which order |
| `render.lua` | draws the plain paragraphs for the PDF; the app never needs it |
| `fa/…` | one folder per language, same file names |

**Change freely:** every word; act and scene titles (the PDF shows them, the
game doesn't); stage directions, comments and notes; the order of lines; adding
and cutting lines; manners; speaker names in `decl.tex` (`\speaker{blue}{Blue}`:
the second one); act and scene labels — a choice that points at a renamed label
is a lint error that names it.

**Names the code uses — change them with an agent:** the side trips' labels
(`cow`, `human`, `workshop`), the keys in `\item[…]`, the names in `\val{…}`,
action words and their arguments, the file names in `cards/` and `widgets/`, and
speaker ids (`\speaker{blue}{…}`: the first one).

**What the stage needs from the script.** A few steps do something only the
stage knows how to do, and it finds them by what they do, never by where they
are: the bubble with `\meet{red}` is Red's call, the one with `\equalize` is the
hold for 8 and 8, the choices answering `prediction=` are the guess, and so on
(`ROLES` in `scenes/pair/script.ts`). Move, add or cut lines freely; if an edit
removes one of these, the tests say which. A side trip's captions fall on its
plates by beat (`CAPTION_BEATS` in `src/lib/content/story.ts`): adding a caption
to the cow needs a beat for it.

**The timeline shows everything the reader could see at that moment, in
place.** What stands on its own — a card, a widget — is a **unit**: a file of
its own, which doesn't know what it is. Whoever includes it decides: `\card{gini}`
in the timeline drops `cards/gini.tex` as a card, and the PDF draws it right
there; `main.tex` prints every widget at the back. A pool file (`pool.tex`,
sections picked with `\pick`) is for material reused in more than one place,
such as newspaper headlines; nothing needs one yet.

## 1. Paragraphs

A paragraph is the text between blank lines. How it starts says what it is:

| Starts with | It is |
|---|---|
| `Name:` or `Name (manner, …):` — a declared speaker | a **bubble**; each later line is a line break |
| `\` and an action | an **action** paragraph, one action per line |
| `\section` / `\subsection` + `\label{…}` | **structure**: an **act** / a **scene** |
| `\begin{description}` | **UI strings**: `\item[key] words` |
| `\begin{figure}` | a **figure** (§1.4) |
| `\[` | a **formula**, closed by `\]` in the same paragraph |
| anything else | in the timeline, a **stage direction**; in a unit, its **words** |

- `%` comments sit on their own lines: notes for agents, and history. Never output.
- **One paragraph is one step** of the stage, with one exception: a run of
  conditioned bubbles (§5).
- **Stage directions say what is on screen**, plainly: they become the
  screen-reader text and the transcript. Dates, sources and reasons go in `%`
  comments.

### 1.1 Acts and scenes

`\section{…}\label{act:…}` is an **act**: where the talk clears. Every act is
made of **scenes**, `\subsection{…}\label{…}`, and every bubble belongs to one.
The PDF numbers scenes straight through (Scene 1, 2, … 26) and side trips B1,
B2, B3. A scene's label is what jumps and bubble ids use.

### 1.2 Lines inside a bubble

```latex
Red: Yes. And I'll match that.     % words: this line and the next are the bubble
\stake{2}                          % a cue: plays as the bubble arrives
\todo{draft}                       % attachments: notes on the bubble
\marginpar{The stake is half of the poorer fortune, every round.}
```

- A line holding only `\label`, `\marginpar`, `\todo` or `\adapt` **attaches**
  to the bubble. It is not a line of words, and it may run over several lines.
- A line holding an action is a **cue**: it plays as the bubble arrives. A
  reader action as a cue (`\meet{red}`) makes the bubble wait for the reader.
- Put words first, then cues, then attachments.

### 1.3 Variants

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

An item can hold longer: `\item[hold 3] Grit` stays 3 beats (the PDF prints
"hold 3" as its label). In the title's reel, the item in bold is the one it
lands on — `\item \textbf{Math}` — and the items after it are the wrong words it
overshoots onto before coming back.

### 1.4 Figures and formulas

```latex
\begin{figure}
  \plot{lorenz}                          % what the stage draws there
  \axes{people, poorest first}{share}    % optional: its axes' words
  \caption{How far the room bent}        % optional
\end{figure}

\[ N = \frac{1}{\sum_i s_i^2} \]
```

A figure never floats: it stays where it is written. Code owns the picture;
`\plot` names it (`\thumb{id}` for a still). A formula is typeset in the PDF
and by KaTeX on the web.

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

A bubble of several lines is usually `flow` (owner, 2026-10-09: "always use
flow for multi lines"): its lines come one after another, and the talk goes on
once they are read. Leave `flow` off only where the reader should stop and
think.

Feeling words, in the same parentheses, show on the speaker's face as the line
is said: subtly, and they fade as any feeling does. `Blue (proud): …`,
`Red (aside, calm): …`.

| Feeling | On the face |
|---|---|
| `glad` | a warm smile |
| `proud` | a smile, the chin up |
| `smug` | a half smile, looking down on it |
| `amused` | a grin, the eyes bright |
| `calm` | soft and easy |
| `sure` | steady, a little firm |
| `curious` | the brows up |
| `surprised` | the brows high, the eyes wide |
| `worried` | the brows knit |
| `annoyed` | a frown |
| `sad` | the eyes and the mouth down |
| `shy` | a flush |
| `tired` | heavy lids |

Any other word is kept as a delivery hint, with a warning.

## 3. Words

Inside words, only these: `\emph{}`, `\textbf{}`, `{\large …}`, `{\Large …}`
(said louder), `$…$` (math), `\val{name}` or `\val{name}{example}` (a live
value), `\plural{one}{many}`, `\gls{card}` or `\gls{card}{words}` (the words
open that card), `\footnote{}`, `\cite{}`, `\ref{}`, and the escapes
`\% \$ \& \# \_ \{ \} ~ -- ---` ``` ``…'' ```.

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
| `\reveal{x}` / `\hide{x}` | shows or takes away a thing: `headline`, `merit`, `or`, `math`, `mark`, `coins`, `coin`, `words`, `card:<id>`, `curve`, `diagonal`, `gap`, `lorenz`, `map`, `fit`, `toy:<id>`, and the ending's `keepers` (one owner), `sharers` (everyone equal) and `world` (the room the dial makes, between them); `\hide{curve}` undoes the walk, in reverse |
| `\crowd{x}` | the crowd: `idle`, `payout`, `two`, `room`, `empty` |
| `\stake{n}` | each puts n coins on the table |
| `\flip{side}` | the coin lands on `blue` or `red`; the result is logged |
| `\run` / `\run[longer]` / `\run[game]` | the room plays; played on; the tax game |
| `\arrange{x}` | the room stands as `piles`, `ruler`, `line`, `equal`, `zero`, `double`, `half`, `one`, `four`, `turnover`, `levy4`, `veil` (the ending: the two limits, Blue and Red outside the room), `free` |
| `\control{x}` | the reader holds `stake`, `tax`, `rules` (both dials), `veil` (the ending's levy dial), `sandbox`, or `none` |
| `\levy{x}` | the lesson's pool: `collect`, `return` |
| `\match` | the room and its mirror, on the same luck |
| `\pairs{n}` | n rounds: two from the room, drawn at random, step out, play the coin, and go back; after a round told part by part, quicker |
| `\pairs[part]{1}` | one part of the next round, as it is told: `pick` (two step out), `stake` (the stakes go in), `flip` (the toss, the take, and home) |
| `\learn{id}{n}` | opens card `id` showing its first n lines: `\learn{rule}{0}` opens it empty, and each line appears once the reader has been told it |
| `\point{x}` | rings a spot while the line shows, and the two (and the room) look at it: `blue`, `red`, `richest`, `dust`, `diagonal`, `gap`, `pool` |
| `\moment{x}` | the room moves through its own run, rewound or wound on, to `start`, `end`, or `gini=0.5` (the first moment its Gini reaches it); histograms and the Gini plot hold still |
| `\image{name}` | posts a picture with the bubble, like a photo in a chat; several make a row (the joke's plates: `introduction`, `darwin`, `chemist`, `silence`, `cow-looks`, `cow-moos`, `scratch`, `physicist`, `spherical`, `vacuum`, `football`) |
| `\card{id}` | drops `cards/<id>.tex` into the stack; the PDF draws the card where it first drops |
| `\pin{id}` | pins the concept's picture to the side rail |
| `\toy{id}` | in a unit: a widget inside it, opened on request |
| `\meet{who}` | *reader*: clicks the circle |
| `\equalize` | *reader*: moves coins until 8 and 8 |
| `\choice{words}` | *reader*: a choice; see below |
| `\when{…}` / `\on{…}` | a bubble's condition (§5) |
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
| a scene or act label: `{cow}` | jumps there |
| `fact=value`: `{bet=coffee}` | records the answer; the bubble waits for it |
| an action: `{\run}` | does it |

Jump targets are structure labels only: a translation may merge bubbles, so a
bubble label is not in every language.

## 5. Conditions

`decl.tex` declares `\facts{…}` (what happened: the bet, the winner) and
`\events{…}` (moments: the first coin moves). A bubble with a condition cue
plays only when it holds:

```latex
Red (aside): And how much would you bet on that?
\choice{A coffee}{bet=coffee}
\choice{A lunch}{bet=lunch}

Blue (aside, flow): A coffee. Careful with your money. I respect that.
\when{bet=coffee}

Red (aside, flow): A lunch. Fair. The winner picks the place.
\when{bet=lunch}
```

- **`\when{fact=value}`:** a run of consecutive `\when` bubbles is **one step**:
  the stage plays the ones whose condition holds, in order. Several bubbles
  under the same condition are a small scene.
- **`\on{event}`:** reactions. They belong to the step before them and play
  when the event happens during it.
- **The tripwire:** one condition per bubble, and a condition is exactly one
  `fact=value` or one event. "And", "or" or a comparison is a lint error and
  goes to the owner.

## 6. Timing

`decl.tex` holds the only absolute numbers: `\beat{0.6s} \perword{0.4s}
\minread{1.5s} \nudge{4s}`. A key line waits; `flow` shows for
`max(minread, words × perword)`; `\pause[n]` is n beats. The script says what
happens and when, never how: coordinates, colours, easing and animation lengths
stay in code.

## 7. IDs, skeleton, translation

- A bubble's id is `<scene label>.<n>`, n counting bubbles only. The PDF prints
  it at the end of the bubble.
- **The skeleton** is the timeline's structure labels, its actions with their
  arguments (conditions included), and the choice targets. It is identical in
  every language; between two skeleton points the words are free (Farsi may use
  two bubbles where English uses one). Units are matched by file name.
- UI strings keep their keys (`\item[log.toss]`) in every language.

## 8. Lint

Errors: an undeclared speaker, fact or event; a command outside the grammar; a
bare `%`; a `$` before a digit; an act or scene without a label; an act with
content before its first scene; a label used twice; a compound condition, or two
conditions on one bubble; a choice target that is none of the four; a list
outside a bubble or an action; `\card{id}` with no `cards/<id>.tex`; a unit that
doesn't start with its title, or has someone speaking; more than 18 words in an
English bubble; a translation whose skeleton differs from English. Warnings:
more than 12 words; an unknown manner word; a card that is never dropped.

## Changes from v0 (the brief of 2026-09-26)

Proposed and accepted in v0.1: attachment lines; variants; `\adapt`; manner
words stay English; `\expect` checks and `\params` never sets holdings; jump
targets are structure labels; `\pick{group}`; `\nudge`; bubble numbers count
bubbles only; LuaLaTeX.

Added while transcribing the running game: one paragraph is one step, and
action lines in a bubble are its cues; the talk clears at acts; the manners
`brief` and `interrupts`; choice targets beyond a label; the story's actions.

Reorganised 2026-09-27 (owner): cards and widgets are units, one file each, that
don't know what they are; alternatives and reactions are conditioned bubbles in
the scene where they play, not pool sections; every act is made of numbered
scenes; directions say only what is on screen; figures (`\plot`, `\axes`),
display formulas and `\toy`; `\gls` links words to their card.

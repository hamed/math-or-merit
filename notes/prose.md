# The words

Every word the reader sees, in order, with just enough of the picture to know
what you are writing over. **Edit this file only.** Getting it back into the
essay, the scenes and the widgets is my job.

Rules of the road:

- Rewrite anything. Cut anything. Add lines, drop lines, merge them.
- Keep the `[tags]` — they are how I find the line again. Text after the tag is
  yours.
- **★** marks wording you approved. I keep it exactly.
- **(draft)** marks everything else: placeholders from the design brief or from
  me, kept to the length and the claim, not to your voice. Rewrite freely.
- Dialogue reads `[tag] BLUE: …` or `[tag] RED: …`. One bubble per tag, one
  sentence per line inside it (` / ` between lines). `**…**` is said louder.
  Aim for 12 words, never more than 18.
- `{name}` is a live value. The line around it is one whole sentence, never
  glued from pieces — word order changes in other languages.
- `~ adapt:` is a note for translators on wordplay: replace the idea, not the
  words.
- ` / ` inside a line is a line break on screen.
- `> picture:` tells you what is on screen while that line is read. Never
  displayed. `[ACTION]`, `[HOLD]` and `[CHOICE]` inside it say what happens and
  what waits for the reader.
- `! keep true:` marks the handful of places where a claim is load-bearing. Say
  it any way you like; just don't make it say more than that. **Characters may
  be wrong; the essay may not** — when Blue says something false, a later line
  or the picture corrects it.

> STATUS (2026-09-26). This file LEADS the build: it holds the dialogue script
> from the design briefs (v3 `inbox/2026-09-24 note.md`, decision D19;
> iteration 2 `inbox/merit-or-math-iteration-2.md`, D20), and
> `messages/en.json` is generated from it — after editing, run
> `npx vite-node scripts/prose-to-messages.ts` (a test refuses a stale file).
> BUILT so far: Scenes 1–11 on the stage, and both branches (B1, B2).
> Still the narrator on screen: the guess onward. Those lines are at the
> bottom, under "Retiring" — each goes when the act replacing it ships.
> One sentence per line: ` / ` starts a new line inside a bubble, and the
> lines of a bubble arrive one after another.

---

## 1 · Title — Scene 1 (chapter `question`)

> picture: the teletype types the news line, as today. Then the title builds in
> reading order: MERIT fades in, plain, with no reel; then "or"; then MATH
> arrives through its reel; then "?". Blue sits under MERIT, Red under MATH,
> breathing. The reel starts on a couple of funny wrong words, turns slowly
> enough to read every word, runs two wrong words past the answer and comes
> back to rest on it. On a phone the words shrink; they are never stacked.
> In Farsi the whole line mirrors like everything else: MERIT comes first, on
> the right, and Blue with it.

[open.headline] The world has its first trillionaire.

[open.source] (on paper · Reuters · June 14, 2026)

! keep true: "on paper" and the dated source stay attached to the headline.

[open.title] Merit or Math? ★

> the common sense comes first, the question second (owner, 2026-09-26).

[open.title.merit] Merit

[open.title.or] or

[open.title.mark] ?

~ adapt: [open.title.mark] is the language's own question mark ("؟" in Farsi).

[open.reel.math] (draft) Horoscope · Lucky socks · Timing · Connections · Family money · Luck · **Math** · Coffee · Blue eyes

> the reel opens on two funny wrong words, passes the serious answers, lands on
> MATH — always the THIRD FROM LAST — and the last two are the wrong words it
> overshoots onto before settling back. Race, Genes, God's will and Class stay
> off it: they take political sides.

~ adapt: translate each word as the everyday explanation, not literally; keep
the answer third from last and the two after it wrong.

[open.credit] Created & directed by Hamed

---

## 2 · The crowd — Scene 2

> picture (owner, 2026-09-26 — Phase 2; the v3 bites are on screen until then):
> people come in from different directions, bouncing and jumping, and settle as
> a loose crowd — truly random, no rows, no clusters of one shape or colour,
> everyone the same size. Coins fall at random: some people catch them and
> grow, some do not. Then they bump into each other, and every bump is a trade.
> One grows very big, one ends up small. The rest bounce and jump and move out.
> Those two stay: the big one under MERIT, the small one under MATH. No words,
> no numbers.

! keep true: every trade follows the game's own rule — the stake is half of the
smaller fortune, the winner takes it. It ends at 15 and 1.

---

## 3 · Meeting them — Scene 3

> picture: the two survivors, still neutral. Red calls first. A click makes a
> circle take its colours and introduce itself at once; then the other one
> calls. If the reader waits, the caller tries again, a little louder.
> [HOLD] until Red is clicked, then [HOLD] until Blue is clicked.

[meet.red.call] RED: (draft) Hi. · Hello? · Anybody there? · Click on me.

[meet.red] RED: I'm the poorest man in this world. ★

[meet.blue.call] BLUE: (draft) Psst. Over here. · Over here! · Click me. I'm the important one.

[meet.blue] BLUE: I'm the richest man in this world. ★

[name.blue] Blue

[name.red] Red

> the names themselves. A screen reader says the name before each of that
> character's lines, and it labels his circle.

[meet.tip] RED: (draft) Click, press a key, or scroll to go on.

> the one line about controls, and it waits for the reader. Removed
> 2026-09-26: "'This world' means the one on your screen" and Blue's "Small
> world. But it's mine." ("Everybody knows that.")

! keep true: Blue is LIKE a tech billionaire and is never a real person; he
quotes and imitates no one. The essay explains no real person's fortune.

---

## 4 · The merit debate — Scene 4

> picture: Blue argues from under MERIT, Red answers from under MATH. Every
> line here is a key line: it waits for the reader. Red hints at chance
> without a technical word — no coins, no games, no probability.

[merit.1b] BLUE: I work hard for it. ★

[merit.1r] RED: I work two shifts to pay the bills. ★

[merit.2b] BLUE: I'm smart. ★

[merit.2r] RED: I'm smart too. / I have a PhD in physics. ★

[merit.3b] BLUE: I take big risks, and win big. ★

[merit.3r] RED: I take risks too. / But nobody catches me when I fall. ★

> cut 2026-09-26: the GPS pair (too long), "Look, anyone could be where I am"
> with Red's "standing here first…" (out of character; the pair goes), and
> "Success finds the people who deserve it" with its reply.

! keep true: these are two characters' opinions, not the essay's findings.
Nothing here is shown true until the game shows it.

---

## 5 · The invitation — Scene 5

> picture: numbers appear for the first time — each fortune shown as its coins,
> packed tight. Every coin is the same size everywhere, and a circle's area is
> its coins' area.

[invite.1] RED: (draft) Let's play a game.

[invite.2] BLUE: (draft) I don't play games. / I build things.

[invite.3] RED: (draft) Just try it. We start equal.

[invite.4] BLUE: (draft) Equal? / Why would I give up my wealth?

[invite.5] RED: It's only a simulation. ★

[invite.6] BLUE: Fine. / I like a good experiment. ★

> [ACTION] the title and every other word move up and out. Only the two remain.

[equal.ask] BLUE: Give him some of my coins. ★

> picture: a tap on a circle sends one of its coins, visibly, to the other; or
> drag a coin across and it follows the finger. Moving coins back is allowed.
> Each circle re-sizes by area after every move.
> [HOLD] until 8 and 8.

[equal.give] (draft) Give one of {name}'s coins to {other}. {name} has {count}.

> not a bubble: what a screen reader hears on each circle while coins are being
> moved, and the keyboard path through this hold.

[equal.first] BLUE: (draft) Hey!

> after the first coin moves.

[equal.eleven] BLUE: (draft) I liked that one.

> when Blue is down to 11.

[equal.over.b] BLUE: (draft) Whoa. Equal, not upside down.

[equal.over.r] RED: (draft) Tempting. But give him one back.

> when Red goes above 8.

[equal.done] RED: (draft) Eight and eight. Perfect.

---

## 6 · Round one — Scene 6

> picture: Blue is trader A, Red is trader B. The stakes are the same coins,
> on the table below the pair. The decider is one plain coin until it is
> tossed: Marx is Red's side, the bank is Blue's. The rule is deliberately
> incomplete here.

[r1.rules] RED: The rules are simple. / We each put half on the table. ★

[r1.half] BLUE: Half of 8. / 4 each. ★

> [ACTION] four coins from each circle move to the table.

[r1.flip] RED: We flip a coin. / Blue side, you win. / Red side, I win. ★

[r1.winner] RED: The winner takes it all. ★

~ adapt: [r1.winner] echoes a well-known song title in English. The line must
still read plainly — the winner of the toss takes both stakes.

> [ACTION] the coin turns; its faces change only when it is edge-on. Red
> lands. Blue 4, Red 12.

[log.toss] (draft) {winner} wins. Blue {blue}, Red {red}.

> not a bubble: after every toss the result is logged in the talk, beside the
> coin that landed, and moves up with the lines — so the reader can always see
> what happened (owner, 2026-09-26).

[r1.ouch] BLUE: Ouch! ★

---

## 7 · Round two — the rule breaks and gets fixed — Scene 7

[r2.wait] BLUE: Wait! / I have 4. I can't put in as much as you. ★

[r2.half] RED: Put in half of what you have. ★

[r2.two] BLUE: Only 2? ★

[r2.match] RED: Yes. And I'll match that. ★

> [ACTION] two coins from each circle move to the table.

[r2.rule] BLUE: So we always put in half / of what the poorer one has. ★

[r2.why] RED: Yes. That way everybody can keep playing. ★

[r2.go] BLUE: Smart. / Okay, let's go. / I'll win it back. ★

> [ACTION] blue lands. Blue 6, Red 10. Blue says the rule himself and Red
> confirms it; the stakes are already known to be equal, so nobody says "half
> of each".

---

## 8 · Round three — Scene 8

> slower than before, and the two say what is happening.

[r3.each] RED: (draft) 3 each.

> [ACTION] three coins from each circle move to the table.

[r3.flip] BLUE: (draft) Flip!

> [ACTION] blue lands. Blue 9, Red 7.

[r3.done] BLUE: (draft) And that's how it's done.

! keep true: the three rounds are the real rule played with authored tosses:
8-8, then 4-12, then 6-10, then 9-7. The total never changes, and every stake
is half of the poorer fortune.

---

## 9 · The challenge — Scene 9

[dare.ahead] BLUE: Back where I started. / Well, I'm a bit ahead. Naturally. ★

[dare.pointless] BLUE: This is pointless. ★

[dare.why] RED: (draft) Why?

[dare.edge] BLUE: Nobody has an edge. / Same odds, same rule. / Nobody gets rich. ★

[dare.what] RED: What if one does? / **Very riiich.** ★

[dare.no] BLUE: **Impossible.** ★

> `**…**` in a bubble is said louder: bigger and heavier.

[dare.imagine] RED: But what if that happens? ★

[dare.luck] BLUE: That being rich means nothing. / No talent, no hard work. Just luck. ★

[dare.math] RED: Not merit. Just math. ★

~ adapt: [dare.math] must use the SAME two words as the title in each language.

[dare.nice] BLUE: (draft) Nice line. It won't happen.

[dare.prove] RED: I can prove it. ★

[dare.bet] BLUE: I'll bet half my wealth you can't. ★

[dare.all] RED: I'll bet all of mine. ★

[dare.sure] BLUE: You're either very sure / or very foolish. ★

[dare.laugh] RED: (draft) Let's see who laughs last.

[dare.more] RED: We need more players. / And many more rounds. ★

! keep true: a run shows something; it cannot prove it. Red's "prove" is honest
only because the proof arrives later — the reveal says so, and the theorem pays
it off.

---

## 10 · The crowd arrives — Scene 10

> picture: the room fills around the two (Phase 2: people arrive from all
> sides and the view zooms out, the pair keeping its place). The crowd keeps
> its costumes; Blue and Red keep their unique colours.

[more.shapes] RED: (draft) Different colours. Different shapes. / Only the size counts. The size is the wealth.

[more.random] RED: Each time, / two people are picked at random. ★

! keep true: [more.random] is REQUIRED — the two-person game never taught
random pairing, and every room after this one uses it.

[more.rule] RED: They bet half of what the poorer one has. / Flip. The winner takes it all. ★

[more.watch] BLUE: Nobody gets rich. ★

> Blue laughs.

---

## 11 · The joke offer — Scene 11

[more.real] BLUE: Real life is / much more complicated than this. ★

[more.joke] RED: Of course it is. / Want to hear a joke? ★

[more.choice] (draft) Yes · Not now

> [CHOICE] — links inside Red's bubble: "Yes" opens the cow (B1); "Not now"
> moves on.

---

## B1 · The cow — optional (chapter `cow`)

> picture: your illustrated cast, exactly as it stands. Offered by choice from
> Scene 14.

[cow.offer] (draft) A joke about a cow, and why this model is so simple

> the collapsed branch: this line on a button, where the cow would be. Red's
> "Tell me" opens it too.

> the joke, cut to what it needs — your call, 2026-09-24: every plate stays,
> the text goes wherever the joke survives without it. These five are what
> is left; the rest retired with the narrator.

[cow.once] Once upon a time, / a farmer's cow stopped giving milk.

[cow.0b] A biologist, a chemist, and a physicist.

[cow.4] "Assume a spherical cow."

[cow.5] "In a vacuum and no gravity!"

[cow.7b] The sphere alone answered this question. / Not every question. This one.

> after the pitch beat, the two of them close the joke:

[cow.frame.you] BLUE: (draft) That's you. That's exactly you.

[cow.frame.mine] RED: (draft) And this game is my spherical cow. Simple on purpose.

[cow.frame.next] RED: (draft) Want to see how a person becomes a circle?

[cow.choice] (draft) Show me · Skip

> after the pitch beat. [CHOICE] — "Show me" opens B2.

~ adapt: "spherical cow" is a physicists' joke. Keep a cow and a sphere; the
exact phrase may not exist in your language.

! keep true: the minimal model answers one narrow question; it does not claim
that every omitted detail is powerless. (Today [cow.7b] carries this.)

---

## B2 · The spherical human — optional, after the cow (chapter `spherical-human`)

> picture: the reduction plates, split out of the old merged scene — the
> richest man stripped detail by detail down to one circle.

[human.offer] (draft) How a person becomes a circle

> the collapsed branch: this line on a button. The cow's "Show me" opens it too.

[human.1] I am not going to explain how he got rich.

! keep true: this guard stays with the plates. The essay does not explain any
real fortune.

> OPEN — the plates show a real person, while Blue is only LIKE one. The branch
> must never imply Blue is that person. Is the framing enough?

---

## 15 · The reader's prediction — Scene 15 (chapter `guess`)

[guess.ask] RED: (draft) So. What do you think happens?

> [CHOICE] Still roughly equal · A gentle spread · A split: some rich, some poor
> · One giant, the rest near nothing

[guess.stake] RED: (draft) And how much would you bet on that?

> [CHOICE] A coffee · A lunch · A vacation · 1% of my wealth
> [HOLD] until both are answered. Both answers are remembered.

[guess.coffee] BLUE: (draft · proposed — first to cut) A coffee. Careful with your money. I respect that.

[guess.lunch] RED: (draft · proposed — first to cut) A lunch. Fair. The winner picks the place.

[guess.vacation] BLUE: (draft · proposed — first to cut) A vacation! Now it's serious.

[guess.percent] RED: (draft · proposed — first to cut) One percent. Careful. That's how it starts.

> the reveal runs at exactly half of the poorer fortune — the same bet Red
> names (settled 2026-09-24; it used to be 35%).

---

## 16 · The reveal — Scene 16 (chapters `run`, `why`)

> picture: the live room as today — unseeded, reruns forever, the newspaper
> prints on the winner — with Blue and Red inside it. The lines below branch on
> what ACTUALLY happened in the run.

[reveal.other.b] BLUE: (draft) Who is THAT?

[reveal.other.r] RED: (draft) Nobody special. Same start and same rules as us.

> when someone else finishes richest (the most likely case).

[reveal.blue.b] BLUE: (draft) See? Talent rises.

[reveal.blue.r] RED: (draft) Run it again and see if your talent comes along.

> when Blue finishes richest.

[reveal.red.r] RED: (draft) Look at that. Am I a genius now?

[reveal.red.b] BLUE: (draft) …Run it again.

> when Red finishes richest.

[reveal.bet] RED: (draft) You bet {stake} on "{prediction}".

> followed by one line on whether the reader was right — OPEN, to be written.

[reveal.once] RED: (draft) And that's one run. It shows, it doesn't prove. The proof comes later.

[reveal.paper.b] BLUE: (draft) See? The paper says it was vision.

[reveal.paper.r] RED: (draft) The paper wrote that after the result. The coin never saw a thing.

[reveal.paper.again] RED: (draft) New winner. New reason. The paper never prints "chance."

> after the newspaper prints; [reveal.paper.again] after a rerun.

! keep true: every claim here is about one finite run. No "always", no
distribution family, no naming a psychological bias. The result comes first and
the explanation second; colour, corners and edges never touch the game.

> OPEN — the payoff of Blue and Red's bet, and of the reader's.

---

## 17 · Line them up (chapter `line-them-up`)

> picture: the same circles you watched trade — scattered, sorted, dropped into
> piles, then the ruler switches to multiplying by ten. On the ordinary ruler
> the decade marks (1¢ … $1k …) crowd into the first few pixels; on the
> multiplying ruler they slide apart into even steps.

[sort.1] RED: (draft) Too many circles to count. Let's sort them into piles.

[sort.2] BLUE: (draft) Most have almost nothing. A few have a lot. That's just real life.

[sort.3] RED: (draft) It's also this world. And here, nobody had an edge.

[sort.4] RED: (draft) The piles are my choice. Move the slider. The fortunes don't change.

[sort.5] BLUE: (draft) This chart is useless, though. Everyone is squeezed into one corner.

[sort.6] RED: (draft) Then let's change the ruler.

[sort.7] RED: (draft) Now each step means ten times more, not ten more.

[sort.8] BLUE: (draft) One, ten, a hundred, a thousand. Even steps. Huh.

[sort.9] RED: (draft) Less than a cent goes in the dust box. Zero has no place on this ruler.

! keep true: the multiplying ruler only makes hidden values visible. It proves
nothing about what kind of distribution this is.

---

## 18 · Measure the room (chapter `gini`)

[gini.1] BLUE: (draft) Economists love a single number. What's ours?

[gini.2] RED: (draft) Watch it being built. Zero means everyone has the same.

[gini.3] RED: (draft) One is the far edge: one owner, everyone else at nothing.

### Effective participants

> picture: four people on the corners of a square, four coins each. The reader
> moves coins; someone with none stays visible as a dashed ring.

[eff.1] BLUE: (draft) A hundred players. That's a lot of competition.

[eff.2] RED: (draft) Is it? Start with four. Move the coins yourself.

[eff.equal] BLUE: (draft) Four people, four players. Fair.

> when all four are equal.

[eff.one] BLUE: (draft) Four people, one player. Me, I hope.

> when one holds everything.

[eff.3] RED: (draft) Four bodies still in the room. The number counts the field they have left.

[participation.formula] Open the black box: write each person's share of the
room as sᵢ. Square the shares, add them, then take the reciprocal: 1 / Σsᵢ².
This is the inverse Herfindahl concentration index.

> a claim note (the fold-out "Open the black box"), not dialogue.

> OPEN — your top-k view: sort the people biggest first, and after each one
> compute 1/Σsᵢ² with sᵢ as each person's share WITHIN that top group — so the
> top one alone gives exactly 1, the top two 1.8 or so, and the count flattens
> far below k. Reading confirmed with you on 2026-09-22 (and proved to always
> rise and to end exactly on the whole-room number). Where it goes is still
> yours to say — the crowd chapter?

### Turnover

[turn.1] RED: (draft) The trade counter keeps racing. But most people have almost nothing left to bet.

[turn.2] BLUE: (draft) So a million trades can move almost nothing.

[turn.3] RED: (draft) Right. So we count the money that actually changes hands.

[turn.def] (draft) One measurement round is one trade per person on average.
Ordinary turnover adds the stakes that crossed between people in that round and
divides by all the wealth in the room. 0.30 roomfuls means wealth equal to 30%
of the room changed hands.

> a claim note, not dialogue — the definition every later turnover readout leans on.

! keep true: only trades count as turnover. Levies and shared returns are kept
in their own ledger; the remedy never pads this number.

---

## 19 · More of them · Where it ends · Your hand on the dial (chapters `crowd`, `where-it-ends`, `dial`)

[crowd.1] BLUE: (draft) Surely a bigger crowd evens things out.

[crowd.2] RED: (draft) A thousand people. Two million fair trades. Let's see.

[crowd.3] BLUE: (draft) …It doesn't.

[end.1] BLUE: (draft) Fine. But a run is just one run.

[end.2] RED: (draft) True. Now the proof I promised you.

[end.3] RED: (draft) Keep going without end, and one owner takes it all. That's proven.

[end.4] BLUE: (draft) "Without end" is a long time.

[end.5] RED: (draft) It is. It's a limit, not a date.

[end.6] BLUE: (draft) Look, the top keeps changing.

[end.7] RED: (draft) The name changes. The shape doesn't.

[end.citation] For a fixed finite number of agents and a fixed stake fraction
0 < β < 1, the wealth vector converges almost surely to one of the room's
one-owner states. "Almost surely" means probability one; it does not mean every
imaginable sequence of coin tosses. The proof is in Börgers & Greengard (2023).

! keep true: the single-owner ending is a limit result, not a prediction of a
date, and the citation stays.

[stake.1] BLUE: (draft) Then make the bets smaller. Problem solved.

[stake.2] RED: (draft) Try it. Smaller bets take longer. They still get there.

[stake.3] BLUE: (draft) And zero?

[stake.4] RED: (draft) Zero isn't a slow game. It's no game.

! keep true: the stake changes the speed, not the ending. Don't state a formula
for how much faster.

---

## 20 · Now you try to stop it (chapter `stop-it`)

[tax.1] BLUE: (draft) Let me guess. Now you want to tax me.

[tax.2] RED: (draft) I want you to try. Keep at least twenty players in the game.

[tax.3] RED: (draft) Tap a big fortune. A quarter goes into a pool, shared equally by everyone.

[tax.4] BLUE: (draft) Tax me too much and I stop building.

[tax.5] RED: (draft) Fair point. In this world nobody builds. They only trade. So we test the math alone.

> Blue's objection stays prominent: it is the fair fight, and it is the model's
> honest limit — nothing is produced here, only traded.

[tax.after.1] RED: (draft) Notice what your hand did. It picked one person, again and again.

[tax.after.2] BLUE: (draft) Exhausting.

[tax.after.3] RED: (draft) Then let's write it into the rules.

! keep true: whether a fast hand can hold the room is genuinely open. The game
is not rigged to make you lose.

---

## 21 · The levy in the rules · Trade and return together (chapters `levy`, `tax-against-trade`)

[levy.1] RED: (draft) Same percentage from everyone. One pool. Shared back equally.

[levy.2] BLUE: (draft) That's just taking my money.

[levy.3] RED: (draft) Watch the return. Below average gains. Average breaks even. Above pays in.

[levy.4] BLUE: (draft) And the room?

[levy.5] RED: (draft) Keeps every coin.

[match.1] RED: (draft) Same luck, same trades, twice. Only one room gets the rule.

[match.2] BLUE: (draft) So luck can't take the credit.

[map.1] BLUE: (draft) One pair proves nothing.

[map.2] RED: (draft) Agreed. So let's fill a map.

[map.3] RED: (draft) That line is my challenge, not a law of nature.

[map.4] BLUE: (draft) A small levy keeps the field open, even with big bets?

[map.5] RED: (draft) In this room, yes. It's not a tax formula.

! keep true: effective participants is the primary field; 50 is a chosen target;
the map is finite-run evidence; the square curve is fitted, not a phase
boundary or law. Never say "phase transition", "law" or "theoretical" here.

---

## 22 · The verdict (chapter `verdict`)

[verdict.1] RED: (draft) The coin was fair the whole time. It never saw a name.

[verdict.2] BLUE: (draft) Then how did one of us end up with everything?

[verdict.3] RED: (draft) Money didn't buy better odds. It bought more tosses you could survive.

[verdict.4] RED: (draft) Then a shared levy with an equal return kept more people able to play.

[verdict.5] BLUE: (draft) So you're against merit.

[verdict.6] RED: (draft) No. I'm worried about the field merit plays on.

[verdict.7] BLUE: (draft · proposed) If merit is supposed to win…

[verdict.8] RED: (draft · proposed) …keep the game open long enough for merit to play.

> proposed: the essay's closing line goes to the merit defender.

! keep true: the conclusion distinguishes fair odds from staying power, names
the full levy-plus-equal-return mechanism, explains no real person's wealth,
and is not an argument against merit.

> OPEN — the ending as a whole, including the payoff of both bets.

---

## 23 · The sandbox (chapter `sandbox`)

[sandbox.1] RED: (draft) I'm done touching the controls.

[sandbox.2] BLUE: (draft) The machine is yours. Break our argument.

! keep true: the levy here is a toy. No claim about real tax policy.

---

# Appendix · buttons and labels

Not prose. Edit only if a word annoys you.

[ui.run] Run this room · Run it again · Run it again — new dice · Start the room

[ui.dist] Stack them into piles · Change the ruler · Add them up · Bend it yourself

[ui.tax] Start levying · Keep levying

[ui.hint] Clicking an agent levies them · Clicking an agent photographs them for the front page

[ui.lorenz] Lorenz curve and Gini

[ui.end] Close enough for pixels

---

# Retiring — the narrator's lines

Deleted by default (D19): the essay is a dialogue now. They stay here, word for
word, until the scene that replaces them ships, so nothing disappears silently.
Nobody has claimed any of them (2026-09-24), so each one goes when the scene
replacing it ships.

Every `! keep true:` these lines carried has already moved up into the script.

> Gone from the build 2026-09-24: the cow's bridge cards and every caption the
> owner's cut left out, and the spherical human's narration and its trade —
> Blue and Red play that game on the pair stage now.

## Your turn to guess

[guess.head] Your turn to guess

[guess.body]
Now remove the script. Put one hundred equal fortunes in the room.

1. Everyone starts with the same money.
2. Pick two people at random.
3. Both put up half of whatever the poorer one has.
4. Toss for it. One wins, one loses. Fifty-fifty.
5. Go back to 2.

After a hundred thousand fair trades, what survives? Pick one before the coin speaks.

## Now run it · So why did they win?

[run.head] Now run it

[run.intro] A hundred equal fortunes. The colors and corners are costumes. The game cannot see them.

> [run.intro]'s second and third sentences are named in the brief as a line
> the costumed rooms depend on. Say if it should move into the dialogue.

[run.after]
The largest shape holds [the measured result] of everything.
Every trade was fair. No coin was loaded. Nobody cheated. Nobody was smarter.

[run.after.first] Chance chose which shape finished first.

[run.after.same] The same shape finished first again. A fair coin is allowed to repeat itself.

[run.after.different] This time a different shape finished first.

[run.after.shared] The process needed no difference in merit to make the gap.

[why.head] So why did they win?

[why.body]
The Morning Ledger has already found the secret of success:

(show the exact headline generated by the latest run here; update it after every rerun.)

It sounds almost reasonable. That is how the trick works.

The result came first. The explanation came second. Color, corners and edges never touched the game.

Run it again. Maybe a new winner. Maybe the same one twice. The paper never prints "chance." It simply finds another reason.

Remember the headline we started with? How many reasons did you add before seeing the mechanism?

## Line them up

[sort.head] Line them up

[sort.body]
A hundred circles, all different sizes, scattered around the room. I can spot the winner. I cannot read the room.

So I cheat. First sort them. Then cut the wealth ruler into equal bins and drop one circle into the matching pile. Move the number of piles and watch the picture change. The fortunes do not.

[sort.after]
Now it is a histogram: the bars are the people you just watched. The cuts between bars are my choice, not nature's. That is why the slider matters.

But the richest circle also owns the ruler. Fit it on a straight, adding scale and much of the room is squeezed against zero. So change the ruler. Each step now *multiplies* by ten. Equal distance means ten times the money; the hidden crowd opens up.

Below one cent goes in the dust box. Exact zero belongs there too: zero has no position on a multiplying ruler. The new ruler reveals what the old one hid. It does not explain why the shape exists.

## Measure the room

[gini.head] Measure the room

[gini.body]
A picture is excellent until I want to compare two rooms. Then I need a number.

Start with Gini. I like it because you can watch the number being built.

[gini.after]
Zero means equal. One is the theoretical horizon: as a room grows, one owner and everybody else at nothing gets closer and closer to it.

Useful. But the question I care about is plainer: how many people still carry enough economic weight to matter?

Four people. How many still matter?

Four people enter with four coins each. Move the coins yourself. The people never leave. The black box watches only where the wealth goes.

The box asks how many equal fortunes would be just as concentrated as this room. Four equal fortunes give 4. Split everything equally between two and it gives 2. Give every coin to one owner and it gives 1. In between, it can say 3.88 or 1.47.

That is **effective participants**. Four bodies remain in the room. The number measures the field they have left.

A million trades can move almost nothing

The trade counter keeps racing after most people have almost nothing left to risk. A million crumbs still prints as a million trades.

So I count the money that crossed between people. One **measurement round** is one trade per person on average. Add the stakes transferred in those ordinary trades and divide by all wealth in the room. That is **ordinary turnover**. A result of 0.30 roomfuls means wealth equal to 30% of the room changed hands during that round.

Only trades count. Later, levies and shared returns get their own ledger. The remedy does not get to pad this number.

## More of them

[crowd.head] More of them

[crowd.body] A small room is good for learning the instruments. Now invite a crowd: one thousand equal fortunes, two million fair trades, fresh luck.

[crowd.after]
The histogram says where the people sit. Gini says how far the room bent from equality. Effective participants says how broad the field remains. Turnover says whether all those trades still move meaningful wealth.

Do not ask one number to impersonate another. Read the room with all of them.

## Where it ends

[end.head] Where it ends

[end.body]
That crowd was one run. A run can show you something. It cannot prove it.

Here mathematics says something stronger. Keep the room finite. Pick pairs at random. Use one fixed stake strictly between zero and one hundred percent, and an independent fair coin. Then continue without end. With probability one, wealth converges to a single owner.

[end.after]
The animation is not the proof. It only lets the pixels chase the theorem.

"Without end" is doing serious work. This is a limit, not a date. At any finite time the room can be deeply concentrated without literally reaching one owner. The path can wobble, too: a poorer circle can win and the room can briefly grow fairer on the way.

## Your hand on the dial

[stake.head] Your hand on the dial

[stake.body]
You have seen the destination. Now put your hand on the clock.

The stake — the fraction of the poorer fortune placed on each toss — has been fixed until now. Turn it down. Turn it up. Every change starts a fresh room, so luck is allowed to heckle your comparison.

[stake.after]
Look for the pattern across runs, not a promise from one of them. Smaller stakes usually take longer to produce a dominant fortune. Larger stakes usually get there faster. I am not claiming an exact stopwatch law here.

The theorem says every fixed positive stake has the same limiting destination. The dial changes the journey, not the limit. Exactly zero is not a very slow game. It switches the game off.

## Now you try to stop it

[tax.head] Now you try to stop it

[tax.body]
Enough watching. Put your hand in the room.

Keep at least twenty effective participants in the game. Tap a large fortune: one quarter of it goes into a common pool and returns in equal shares to all one hundred people. Choose the stake before you start. That changes the difficulty, not the rule.

The room keeps trading while you work. Can your hand preserve the field, or will the game close around you? Nothing is locked behind winning. I want you to feel the job.

[tax.after]
Whatever your score, notice what your hand did. It watched, chose one holder, reacted, and did it again. That is a targeted intervention.

What comes next is not a robot finger. It is a different rule: nobody is selected. The same percentage applies to every fortune, the pieces enter one pool, and the pool returns equally to everyone.

## Put the levy in the rules

[rule.head] Put the levy in the rules

[rule.body]
Your hand gets tired. A rule does not.

Once per measurement round, collect the same percentage of every fortune. Put every piece in one pool. Return the pool equally. That complete loop — levy plus shared return — is the counterforce I am testing.

First, see the tool alone — freeze the trading.

[rule.after] Do not skip the return. Collection alone shrinks every circle by the same proportion and leaves the shares unchanged. The equal return changes them: below-average fortunes receive more than they contributed, an average fortune breaks even, and above-average fortunes contribute net. The room keeps every coin.

Here the return is literal coins. Outside this room it could be a dividend or a universally shared service. This model does not choose a budget. It only tests the shared return.

## Trade and return together

[phase.head] Trade and return together

[phase.body]
Now unfreeze trading. I refuse to compare two unrelated lucky stories and call the difference tax. Instead, write one fresh random script of partners and coin tosses, then photocopy it. One room gets only the trades. The other gets the exact same trades plus the shared rule.

One matched pair is still one finite experiment. Run another and the numbers move. But within each pair, luck is held still. The only changed ingredient is the levy plus equal return.

One pair is not a landscape

Now vary both dials. Stake goes across. Levy per round goes up. Each fresh finite run enters one square, and color answers the question we learned to ask: how many effective participants remain?

[phase.after]
Fifty effective participants is my challenge line, not a law of nature. If you fill the map, the pale line connects settings that reached that chosen finite-run outcome. It is not a border between two phases.

The dashed fit follows `levy ≈ c × stake²` over this measured range. Double the stake and the fitted levy for the same target grows by roughly four. That is not a universal tax formula. It is the relationship this room asks us to notice: a shared levy numerically much smaller than the risk on each trade can preserve a broad field for risk-taking.

Those percentages live on different clocks: stake is at risk in each trade; levy is applied once per measurement round of one hundred trades. The fit compares their measured effects. It does not say the displayed percentages are interchangeable.

## The earned conclusion

[close.head] So — merit, or math?

[close.0] The coin is still fair.

[close.1] It never saw talent, effort, inheritance, power — or even a name. Money did not buy better odds. It bought tosses it could survive. Enough money kept one player at the table while everyone else's chance to make a meaningful bet disappeared.

[close.2] Left alone, the fair game closed itself. Fewer people could put meaningful wealth at risk, and less wealth moved when they traded.

[close.3] Then one shared counterforce kept the field open: collect the same percentage from every fortune, put it in one pool, and return that pool equally. The coin stayed fair. More people stayed able to play.

[close.4] This room cannot tell me why any real person is rich. I threw that world away on purpose. It can tell me something narrower: talent and effort were not required to build the trap.

[close.5] So this is not an argument against merit. It is a warning about the field merit enters.

[close.6] **If merit is supposed to win, keep the game open long enough for merit to play.**

[close.7] I am done touching the controls.

[close.8] The machine is yours. Break my argument.

## The sandbox

[sandbox.head] The sandbox

[sandbox.body]
Everything you have seen was this one machine wearing different costumes. Here it is with every dial exposed: people, stake, levy rate, levy timing — and the room itself answers to your finger. It begins equal, with fresh dice. Effective participants is the first reading; Gini is one button away. Tap anyone, change anything, and see what it takes.

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

[open.reel.math] (draft) Stars · Socks · Timing · Friends · Parents · Luck · **Math** · Coffee · Hair

> the reel opens on two funny wrong words, passes the serious answers, lands on
> MATH — always the THIRD FROM LAST — and the last two are the wrong words it
> overshoots onto before settling back. Short words only (owner, 2026-09-26):
> the title is sized so the widest one never leaves the screen, so one long
> word makes the whole title smaller. Race, Genes, God's will and Class stay
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

[human.back] (draft) Back to the story

> at the end of the branch: a link back into the stage, at the guess (Scene 12).

! keep true: this guard stays with the plates. The essay does not explain any
real fortune.

> OPEN — the plates show a real person, while Blue is only LIKE one. The branch
> must never imply Blue is that person. Is the framing enough?

---

## 12 · Your guess — Scene 12 (inside the stage)

> picture: the same room. No jump to another page: the question, the rule and
> the choices are all in front of the reader at once (brief Scene 12). The rule
> card opens beside Red's bubble; the choices sit inside a large bubble.

[guess.ask] RED: (draft) Now it's your turn to guess.

[guess.rule] RED: (draft) Remember the rule.

[guess.what] RED: (draft) What do you think will happen?

[guess.choice] (draft) Still roughly equal · A gentle spread · A split: some rich, some poor · One giant, the rest near nothing

> [HOLD] until one is picked. Links inside Red's bubble, each with a small
> picture of the room it means.

[guess.stake] RED: (draft) And how much would you bet on that?

[guess.bet] (draft) A coffee · A lunch · A vacation · 1% of my wealth

> [HOLD] until one is picked. Both answers are remembered, and logged in the
> talk as the reader's own lines:

[log.guess] (draft) Your guess: {choice}.

[log.bet] (draft) Your bet: {bet}.

[guess.coffee] BLUE: (draft · proposed — first to cut) A coffee. Careful with your money. I respect that.

[guess.lunch] RED: (draft · proposed — first to cut) A lunch. Fair. The winner picks the place.

[guess.vacation] BLUE: (draft · proposed — first to cut) A vacation! Now it's serious.

[guess.percent] RED: (draft · proposed — first to cut) One percent. Careful. That's how it starts.

> the reveal runs at exactly half of the poorer fortune — the same bet Red
> names (settled 2026-09-24; it used to be 35%).

### The rule card

> the first concept card (brief 1.6): like the rule card in a board game, it
> shows the rule that is running right now, read from the room's own settings
> — {stake} is the live stake. It drops into the stack in the corner once Red
> has said the whole rule (Scene 10), and opens at "Remember the rule."

[card.stack] (draft) Cards

[card.rule.title] (draft) The rule

[card.rule.1] (draft) Pick two people at random.

[card.rule.2] (draft) Each puts in {stake} of what the poorer one has.

[card.rule.3] (draft) Flip a coin. The winner takes both.

[card.rule.4] (draft) Do it again.

[card.close] (draft) Close

[card.play] (draft) Play with it

---

## 13 · The run — Scene 13 (inside the stage)

> picture: the same room, the same hundred, Blue and Red among them. One live
> run — unseeded, slowed down so people can see it (brief: "it was very fast").
> The biggest fortune wears the dashed ring. A forward press finishes the run
> at once. The result and the morning paper are logged in the talk.

[run.go] RED: (draft) Here we go. / Fair trades, one after another.

[run.readout] (draft) {trades} trades. The biggest holds {share}.

[log.run] (draft) After {trades} trades, one of them holds {share} of everything.

> after the run, in the talk; then the morning paper prints there too, on the
> winner, as today.

[run.where] BLUE: Red? Where are you? ★

[run.here] RED: Here. What do you have? ★

[run.have] BLUE: (draft) {blue}. You?

[run.havetoo] RED: (draft) {red}.

[run.told] RED: Told you. ★

> when someone else finishes richest (the most likely case); {blue} and {red}
> are what they actually hold, in dollars (everyone started with $100).

[run.blue.b] BLUE: (draft) See? Talent rises.

[run.blue.r] RED: (draft) Run it again and see if your talent comes along.

> when Blue finishes richest.

[run.red.r] RED: (draft) Look at that. Am I a genius now?

[run.red.b] BLUE: (draft) …Run it again.

> when Red finishes richest.

[run.again] RED: (draft) Let's try again?

[run.choice] (draft) Again · Go on

> [CHOICE] links inside Red's bubble. "Again" runs a new room, right here.

---

## 14 · So why did they win? — Scene 14 (inside the stage)

> picture: the paper is in the talk. Blue takes the paper's side; Red refuses.
> The bias is described, never named (owner, 2026-09-26; research.md C12).

[why.paper] BLUE: (draft) See? The paper knows why.

[why.after] RED: (draft) The paper found the reason after the result. / The coin never saw a thing.

[why.again] RED: (draft) New winner. New reason. / The paper never prints "chance."

> instead of [why.after] once the reader has run the room more than once.

[why.once] RED: (draft) And that's one run. It shows, it doesn't prove. / The proof comes later.

! keep true: every claim here is about one finite run. No "always", no
distribution family, no naming a psychological bias. The result comes first and
the explanation second; colour, corners and edges never touch the game.

> OPEN — the payoff of Blue and Red's bet, and of the reader's.

---

## 15 · Line them up — Scene 15 (inside the stage)

> picture: the same room. The people drop and sort into piles by how much they
> hold, keeping their costumes; the count is written above each pile; the ruler
> is ordinary, its ticks round. Then the ruler changes to multiplying by ten, a
> touch slower, so the labels can be seen moving. Then everyone goes back.

[sort.ask] RED: (draft) A hundred people. / Too many to read at a glance.

[sort.do] (draft) Sort them

[sort.real] BLUE: (draft) Most have almost nothing. A few have a lot. / That's just real life.

[sort.edge] RED: (draft) It's also this room. / And here, nobody had an edge.

[sort.where] BLUE: (draft) Where am I?

[sort.there] RED: (draft) There. With {count} others.

> {count} is how many others share Blue's pile, off the screen.

[sort.squeeze] BLUE: (draft) This chart is useless, though. / Everyone is squeezed into one corner.

[sort.ruler] RED: (draft) Then let's change the ruler.

[sort.ruler.do] (draft) Change the ruler

[sort.times] RED: (draft) Now each step means ten times more, / not ten more.

[sort.even] BLUE: (draft) One, ten, a hundred, a thousand. / Even steps. Huh.

[sort.dust] RED: (draft) Less than a cent goes in the dust box. / Zero has no place on this ruler.

[sort.back] RED: (draft) That's a histogram. / Back to the room?

[sort.back.do] (draft) Put them back

! keep true: the multiplying ruler only makes hidden values visible. It proves
nothing about what kind of distribution this is.

[card.histogram.title] (draft) Histogram

[card.histogram.1] (draft) Sort everyone into piles by how much they have.

[card.histogram.2] (draft) A pile's height is how many people are in it.

[card.histogram.3] (draft) A multiplying ruler shows what an ordinary one squeezes into a corner.

---

## 16 · Measure the room — Scene 16 (inside the stage)

> picture: everyone steps into a line, poorest first. Walking along the line,
> their money is added up as it goes: the running total climbs as a curve above
> them. Equal shares would climb the straight diagonal. The gap between the two
> is the Gini.

[gini.ask] BLUE: (draft) Economists love a single number. / What's ours?

[gini.line] RED: (draft) Line everyone up, poorest first.

[gini.add] RED: (draft) Now walk along the line / and add up their money as you go.

[gini.equal] RED: (draft) If everyone had the same, / the total would climb this straight line.

[gini.gap] RED: (draft) The gap between them is the Gini. / Zero: all the same. One: a single owner.

[gini.value] RED: (draft) This room: {gini}.

[gini.toy] RED: (draft) Want to see the equal case / and play with it?

[gini.toy.choice] (draft) Yes · Not now

> [CHOICE] "Yes" opens the old Gini toy in a panel on the stage; its Done
> link, or "Not now", goes on.

[card.gini.title] (draft) Gini

[card.gini.1] (draft) Line everyone up, poorest first, and add up their money as you go.

[card.gini.2] (draft) 0: everyone has the same. 1: one owner, nothing for the rest.

---

## 17 · How many still count? — Scene 17 (inside the stage)

> picture: the room itself tries the cases (owner, 2026-09-26): everyone the
> same; one person emptied; that person's money given to one other; half the
> room owning it all; one owner; and back to how it really is. Each time Red
> says the number. Then four people step out of the crowd, four coins each,
> and the reader moves the coins.

[eff.ask] BLUE: (draft) A hundred players. / That's a lot of competition.

[eff.equal] RED: (draft) If all hundred had the same, / all hundred would count.

[eff.brutal] RED: (draft) This game is brutal. / No money, and you don't count at all. {count} left.

[eff.give] RED: (draft) Now give his money to one other person. / {count}. A bit less.

[eff.half] RED: (draft) Half of them own it all, equally? / {count}.

[eff.one] RED: (draft) One owns everything? / {count}.

[eff.room] RED: (draft) This room? / About {count}.

> {count} is 1 / Σsᵢ² of the room on screen, to one decimal.

[eff.try] RED: (draft) Your turn. Four of them, four coins each. / Move the coins.

[eff.readout] RED: (draft) Four people. {count} of them count.

> Red, beside the four, reading the number out as the reader moves coins.

[eff.done] (draft) Done

[eff.end] BLUE: (draft) A hundred people. / About {count} players.

[participation.formula] Open the black box: write each person's share of the
room as sᵢ. Square the shares, add them, then take the reciprocal: 1 / Σsᵢ².
This is the inverse Herfindahl concentration index.

> a claim note (the fold-out "Open the black box"), not dialogue — on the card.

[card.participants.title] (draft) Effective participants

[card.participants.1] (draft) How many equal fortunes would be just as concentrated as this room.

[card.participants.2] (draft) Everyone equal: all of them. One owner: 1. No money: you don't count.

---

## 18 · Is anything moving? — Scene 18 (inside the stage)

> picture: the room dims; over it, how much of the room's money changed hands
> in each round of the run, from the first to the last (owner, 2026-09-26:
> "people want an active economy; low turnover is bad even for the right").

[turn.busy] BLUE: (draft) At least it's a busy economy. / {trades} trades!

[turn.count] RED: (draft) Count the money that actually changes hands.

[turn.start] RED: (draft) At first, {early} of the room changed hands every round.

[turn.now] RED: (draft) By the end, {late}. / The trades go on. The money barely moves.

[turn.dead] BLUE: (draft) A dead economy. / Even I don't like that.

[card.turnover.title] (draft) Turnover

[card.turnover.1] (draft) How much of all the money changes hands in one round: one trade per person.

[card.turnover.2] (draft) A busy room moves a lot of its money. A concentrated one barely moves any, however many trades it makes.

! keep true: only trades count as turnover. Levies and shared returns are kept
in their own ledger; the remedy never pads this number.

[dial.label] (draft) {trades} trades

> the time player, beside the charts: the same run, any round of it — minimal,
> like a video player (owner, 2026-09-26). The buttons' names, for screen readers:

[player.play] (draft) Play the run again

[player.pause] (draft) Pause

[player.start] (draft) Back to the start

[player.end] (draft) To the end

[player.scrub] (draft) Where in the run

---


## 19 · Where it ends — Scene 19 (inside the stage)

> picture: the same room. Red states what the mathematics says; "Run it
> longer?" plays the same room on, fast, in place: closer and closer to one
> owner, never on a date. The 1,000-person crowd is cut from the main flow
> (D20 answer 8).

[end.one] RED: (draft) That was one run. / It shows. It doesn't prove.

[end.proof] RED: (draft) The math says more. / Keep playing forever, and one person ends up with everything.

[end.when] BLUE: (draft) When?

[end.limit] RED: (draft) Never on a date. It's a limit. / At any moment, it can still wobble.

[end.longer] RED: (draft) Want to see it run longer?

[end.choice] (draft) Yes · Not now

! keep true: for a fixed finite room, random pairs, a fixed stake strictly
between 0 and 100%, and a fair coin, wealth converges to a single owner with
probability one — a limit, not a date; at any finite time the room can be
deeply concentrated without one owner, and the path can wobble. The animation
is not the proof. Börgers & Greengard (2023), https://arxiv.org/abs/2308.01485.

[card.limit.title] (draft) Where it ends

[card.limit.1] (draft) Keep playing forever: with probability one, one person ends up with everything.

[card.limit.2] (draft) A limit, not a date. At any moment the room can still wobble.

[card.limit.3] (draft) Proof: Börgers & Greengard, 2023.

---

## 20 · Your hand on the dial — Scene 20 (inside the stage)

> picture: a stake dial inside Red's bubble, from nothing to everything
> (brief 1.5: nothing is capped). Every change runs a fresh room of the same
> length, so luck is allowed to heckle the comparison.

[dial.ask] RED: (draft) Your turn. / Pick a stake, from nothing to everything.

[dial.stake] (draft) Stake: {stake}

[dial.zero] RED: (draft) Zero: nothing moves. / That's no game at all.

[dial.slow] RED: (draft) {stake}: slower. / The richest holds {share}.

[dial.fast] RED: (draft) {stake}: faster. / The richest holds {share}.

[dial.all] RED: (draft) Everything on the table: / one loss and you're out. The richest holds {share}.

[dial.same] RED: (draft) {stake}: the stake you watched. / The richest holds {share}.

> Red's one line about the reader's last room, whichever fits.

[dial.law] RED: (draft) Every stake above zero ends the same way. / The stake changes the journey, not the end.

! keep true: the qualitative split only — every fixed stake in (0, 1) has the
same limit (C4); the rate is what these runs did, not a law. Exactly zero
switches the game off.

[card.stake.title] (draft) The stake

[card.stake.1] (draft) How much of the poorer one's money goes on each toss.

[card.stake.2] (draft) Any stake above zero ends the same way. Smaller only takes longer. Zero is no game.

---

## 21 · Now you try to stop it — Scene 21 (inside the stage)

> picture: the room trades live. Tapping a fortune takes a quarter of it into
> a pool and shares it back equally — a manual WEALTH levy (C13). Keep at least
> twenty effective participants for thirty seconds. The pace is tuned so a
> diligent hand genuinely can.

[stop.ask] RED: (draft) Enough watching. / Keep at least twenty players in the game.

[stop.how] RED: (draft) Tap a big fortune: a quarter goes into a pool / and comes back to everyone, equally.

[stop.start] (draft) Start

[stop.won] RED: (draft) Thirty seconds, and still {count} players. / Your hand did it.

[stop.lost] RED: (draft) It closed after {seconds} seconds. / {taps} taps weren't enough.

[stop.hand] RED: (draft) Notice what your hand did: / watch, pick one, react. Again and again.

[stop.rule] RED: (draft) Next, not a hand. A rule. / Nobody gets picked.

[stop.meter] (draft) {count} players

[stop.tap] (draft) Take a quarter of {share}

---

## 22 · Put the levy in the rules — Scene 22 (inside the stage)

> picture: trading frozen; four step out with coins — Blue 16, two others 8
> and 4, Red 4 (the average is 8). A quarter of every pile goes to one pool;
> the pool comes back in equal parts: Blue 14, 8, 5, Red 5.

[levy.ask] RED: (draft) Your hand gets tired. / A rule doesn't.

[levy.collect] RED: (draft) Once a round, the same share from everyone: / a quarter.

[levy.same] BLUE: (draft) Everyone lost a quarter. / Nothing changed.

[levy.shares] RED: (draft) Right. Everyone shrank the same. / The shares didn't move.

[levy.return] RED: (draft) Now the pool goes back, / in equal parts.

[levy.net] RED: (draft) The average broke even. / Below it, more came back. Above it, less.

[levy.paid] BLUE: (draft) I paid in.

[levy.kept] RED: (draft) And the room kept every coin.

[levy.pool] (draft) pool

! keep true: the return is literal coins here; outside the room it could be a
dividend or a shared service — the model chooses no budget, it only tests the
shared return.

[card.levy.title] (draft) The shared levy

[card.levy.1] (draft) Once a round: the same share of every fortune into one pool.

[card.levy.2] (draft) The pool comes back in equal parts.

[card.levy.3] (draft) Below the average gains, the average breaks even, above it pays in. Nothing is lost.

---

## 23 · Trade and return together — Scene 23 (inside the stage)

> picture: the room shrinks to one side and a mirror copy appears beside it — a
> parallel universe with the same start and the same luck. Left: trades only.
> Right: the same trades plus a 3% levy and equal return every round.

[match.ask] RED: (draft) Now let it trade. Same luck, twice: / one room without the rule, one with it.

[match.result] RED: (draft) Without the rule: about {a} players. / With it: about {b}.

[match.left] (draft) Trades only

[match.right] (draft) Trades, and a 3% levy shared back

[match.luck] BLUE: (draft) Same coin, same partners?

[match.same] RED: (draft) Every toss the same. / Only the rule changed.

! keep true: one matched pair is one finite experiment; within the pair luck is
held still, and the only changed ingredient is the levy plus equal return.

---

## 24 · The outcome map — Scene 24 (inside the stage)

> picture: the map of stake against levy, each square a finished room,
> coloured by how many still count. The dashed fit is drawn only over the
> range it was measured on; neither it nor the contour is a phase boundary.

[map.ask] BLUE: (draft) One pair is confusing. / Which settings keep the room open?

[map.all] RED: (draft) Try them all: stake across, levy up. / Each square, how many still count.

[map.fit] RED: (draft) A small levy can hold a big stake: / double the stake, about four times the levy.

! keep true: the fit is descriptive, drawn only over the measured range; each
square is the mean of 8 finished rooms (200,000 trades, levy once a round);
the stake is at risk each trade, the levy comes once a round — different
clocks, compared by their measured effects, not interchangeable percentages.

[map.stake] (draft) stake per trade

[map.levy] (draft) levy per round

[map.many] (draft) all 100 count

[map.few] (draft) one counts

[map.half] (draft) half still count

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
>
> Gone 2026-09-26: "Your turn to guess" and its five-step rule list — the guess
> happens inside the stage now (Scene 12), and the rule lives on the rule card.
> Gone the same day: "Now run it" and "So why did they win?" — the run and the
> paper happen in the stage (Scenes 13–14); and "Line them up", "Measure the
> room" and turnover — the histogram, the Gini and effective participants are
> acts on the same room (Scenes 15–17); and "More of them" through "Trade and
> return together" — Scenes 19–24 on the stage; the 1,000-person crowd is cut.

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

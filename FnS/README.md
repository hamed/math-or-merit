# Fair and Square — the stage

The minimal core of the *Fair and Square* redesign: the Yard-Sale model as a
stage. People are shapes whose area is their wealth (total 1), with the
essay's faces; charts are poses of the same bodies; every trade, levy and
count is shown as arithmetic on areas. Headless and deterministic underneath,
with a dev console on top. Standalone: the essay's face engine and trade
function are copied in (`stage/essay/`, see its README).

## The stage

`npm run dev`, then open the page Vite prints. A walled 2 × 2 yard, the dashed
1 × 1 reference box in its middle (area 1 = all the wealth there is; charts
form in it), N people as shapes whose
area is their wealth, with the essay's faces, and a dev console at the bottom
(`` ` `` toggles it, `/` focuses it, space plays/pauses trading). Nothing is
labelled; charts are poses of the same bodies. It opens calm: everyone spread
across the yard, standing, trading paused. `run tour` plays the tutorial
script; `demo` shows every important function in about two minutes (the
room, pairs and the toss, a tax and its pot, a one-off levy, the piece
style, 200 people, the charts, zoom, stats and a share link). `until done`
waits for the pose and for any trade or levy still playing. In landscape the yard keeps a square the height of the window and the
console takes the rest; in portrait the console sits below. `help` lays itself
out to the console's width.

**The law.** Bodies on the ground never overlap and never leave the walls,
checked every substep (1/120 s). One exception, by design: while trading
plays, a chart updates itself and its members glide (0.2 s, one clock, exact
at both ends) to their new places; they may slide past each other during
that glide, as bars do in a bar-chart race. Contacts push pairs apart (positions split
evenly; wealth weighs in on momentum). Whatever is still overlapping goes back,
body by body, to its last valid place: a jam stops the bodies in it and nobody
else. Growth only happens into free space, so a body that can't grow stays
smaller, i.e. denser, which the drawing shows as opacity. Walls open at once
and close only into empty space. Poses end exactly on the figure, to the bit.

**The people.** The room is a pose too (`free`): homes spread evenly over the
yard (a jittered grid by identity, relaxed apart with even margins), where
everyone stands still. Called to a pose, they walk; one that can't get through,
or is still walking after 3 s, hops over the crowd, morphs in the air and lands
on its own spot, shooing off anyone standing there; anyone far away hops at
once. While trading plays, people in place glide with the chart (a live chart
updates 4 times a second), so a live CCDF stays formed: measured 0 hops and
nobody out of place at 36–100 trades a second. A one-off command (`trade
3000`) makes them walk to their new places. `wander` lets them roam instead: they rest, give way
(predicted near misses; head-on, both keep right), slide along whoever they
touch, and say "excuse me" only when stuck. Faces are the essay's own engine
(`stage/essay/face`, copied from the essay): temperaments, felt wealth changes (log
scale), startles on bumps, eyes toward where they walk. Nothing here draws a
character; the engine's SVG paths are painted on the canvas.

**The toolkit.** A pose is a recipe: one word per slot, in any order; bare
words edit the current pose, presets are starting points.

| slot | words |
| --- | --- |
| rescale | `wealth` · `log` (side x/√N) · `logarea` (side √(x/N)), x = (log w − log w_min)/(log w_max − log w_min), current poorest and richest |
| resize | `natural` · `equal` (wealth goes into density) · `squared` (area w²: the N_eff fold) |
| reshape | `square` · `bar [t]` · `col [t]` · `tri` · `hex` (area kept; t defaults to 1/N) |
| sort | `id` · `asc` · `desc` · `shuffle` |
| group | `none` · `median` (odd N: the median person alone) · `quartiles` · `tmb` (bottom 50 / middle 40 / top 10) · `deciles` |
| pose | `free` (spread out, standing) · `wander` · `still` · `stack` · `row` · `pack` · `fold` (squarified into one exact square per group) |
| extras | `gap g` · `prints` (once the photo is ready, copies print across the box one by one: they count N_eff) |

Presets: `ccdf` (log bar desc stack: on a linear scale the richest bar runs
far off the yard; `wealth` after it gives the linear one), `bars`, `columns`, `lineup`, `neff`
(squared fold prints), `classes` (tmb desc fold), `median`, `quartiles`,
`density` (equal desc pack), `room`. Presets work inside recipes:
`squared ccdf`.

**The game.** Total wealth 1, each starts at 1/N. `trade k` runs the master's
`applyYardSaleTrade` with the master's pair sampling and generator, so a seeded
game replays `YardSaleEngine` trade for trade (tested). Rules: `rule beta`,
`rule tax` (a levy per round of N trades), `rule yield equal|mass` (who gives
way); one-offs `levy`, `give`.

**Links.** `share` writes the state into the URL hash: n, seed, starting
rules, the game commands since the last reset, the pose, the face look, a
question (`ask …`), and the play rate (`play=auto` for the default N a second,
a number for that rate). Loading replays it to the bit, wealth and shapes
(`equalize` is a game command, replayed), and opens on the finished pose;
`embed=1` hides the console. Links can only replay game commands; merged
history steps stay within what their command accepts.

**Vocabulary: arithmetic on areas.** Everything the stage shows when money
moves is built from a few primitives; each is tested once, and an act is a
short composition of them.

- *Areas* (`stage/core/area.ts`, pure; a quantity is a box's area, every
  operation exact): `cut` (subtract: a slice off one end), `bar`/`join` (add:
  the smaller of two becomes a bar along the larger's long edge), `pile`
  (sum: pieces joined one by one, each on the side that keeps the pile
  squarest; the finished pile centred), `squares` (divide into n equal
  squares, in rows, centred), `tile` (divide with a
  remainder: whole copies that fill the box), `fold` (the sum of squares,
  `squarify`), and `square`/`bar21`/`morph` (the same area in another shape).
  Three side rules: `cutSide` (across the longer dimension, facing where the
  piece goes), `joinSide` (the long edge, facing where it comes from, unless a
  neighbour is in the way), `squarestSide` (a pile's). `aspect.ts` (everyone's
  proportions) is the same cut and join on a box, so logic and pictures agree.
- *Scale* (`measureOf`, figure.ts): the arithmetic is always in wealth, but
  a pose draws wealth in its own scale (log, logarea, squared). An act takes
  off what the giver's drawn area loses and brings what the taker's gains, as
  that scale draws them, everyone else held as they are; the piece changes
  size on its way (in a log pose a slice and the bar it joins as differ).
  Proportions (aspect.ts) follow the money in wealth, decided as the game
  moves it and taken as it comes off and on: the same history gives the same
  shapes whatever was on screen, so links replay them. When the move shifts the
  poorest or the richest, a log scale renormalises: everyone resizes at the
  next re-form.
- *Time* (`stage/core/motion.ts`): easing (`smooth`, `fast`), the bow path,
  and every beat's length in one table (`DUR`).
- *Money* (`stage/core/transfer.ts`): every change of hands is a move (from,
  to, amount; a levy's through the pot, `POT`), which the game reports
  (`Game.onMoves`). Shown, a move is a transfer: the giver is drawn with the
  money until it comes off, the taker without it until it is taken in, so
  what is drawn follows from the open transfers, and drawn + in transit = all
  the wealth at every frame (tested). Money off and on changes proportions by
  the one rule, shown or not, so links replay to the same shapes.
- *Pieces of money* (`stage/acts/track.ts`): a `Money` on its own track of
  steps: `mark` (cut line), `lift` (off: a gap opens), `reshape`, `wait`,
  `travel` (a bow, changing shape on the way if asked), `close` (back where it
  came from), `dock` (joins a host by the one rule: the gap closes, its
  colour turns, the seam fades), `merge` (on: one body again).
- *Acts* (`stage/acts/`): `piece` = mark, lift, reshape to a square, travel,
  reshape to the bar, dock, merge; `toss` = both mark and lift, a spinner,
  the winner's own stake closes back, the loser's travels (becoming the bar)
  and docks; `levy` = everyone marks and lifts, 2 : 1 bars, staggered travel
  into a `pile`, `squares`, a square travels to each person and docks; `prints`
  (N_eff) = `tile`, copies one by one, framed and counted. The player
  (`stage/core/transit.ts`) runs acts on one clock and knows only their
  contract; the renderer paints the scene they draw (pieces, lines, frames,
  labels, spinners, copies) and knows no act.

**Trades and levies, in beats.** The game moves wealth at once; the stage
shows it happening. `[` and `]` halve and double the speed of everything, to
watch (or teach) the beats one by one. `fx on|off`, `fx trade off|piece|toss`,
`fx tax on|off`, `fx sync on|off`. Two trade modes: `piece` (the default,
trades where people stand) and `toss` (for demos: partners walk up to each
other first, then a spinner decides).

- *Toss* (`fx trade toss`, for demos; only in a round whose partners have
  met, any other trade in this mode is shown as a piece): **pair** (the two look at each other), **score** and
  **separate** (each marks its stake across its longer dimension, at the end
  toward the other, and the stake comes off a hair; nothing moves after
  that), **decide** (a spinner between them, or just above when they stand
  close, turns three times and a bit, slowing, and stops pointing at the
  winner), **keep** (the winner's own stake closes back onto it), **fly**
  (the loser's stake goes to the winner, becoming a bar on the way, its area
  kept), **attach**, **merge**: along the winner's long edge, the side that
  makes it squarer (toward the loser, or the opposite long edge if they stand
  too close). The winner's own stake is only drawn apart, so a toss ends in
  the same shapes as a `piece`. About 3.2 s at speed 1.
- *Meeting* (toss mode): before each played round its partners walk up to
  each other and stand close, face to face, centres level, with room above
  them for the spinner. The pairs stand in justified rows, evenly spaced
  across and up (the row count chosen so pairs stand furthest apart; a row
  crossing the pot's square is split around it, or the rows sit half below
  it and half above), so every round moves them. The dice are only peeked at
  (`Game.peek`), so the round played is the one a link replays. When play
  stops, everyone goes home. `round` waits for the partners.
- *In a chart* (stack, row, pack, fold) everyone is locked to a place, so
  pairs and spinners would mean nothing: trades and levies happen at once
  and the chart re-forms (gliding); back in the room, they are played again.
  Triangles and hexagons also trade at once (a slice of a bounding box is not
  a slice of the shape).
- *Turns*: acts start in the order they come, each once nobody in it is in an
  earlier one still showing, so one body is never cut twice at once; waiting,
  its money is drawn where it was. Every playback keeps to the rate asked for
  (`play 0` plays nothing).
- *Piece* (the default): **pair**, **score** (a cut line across the loser's longer dimension, the
  stake's width from its end toward the winner), **separate** (the slice comes
  off, a gap opens), **reshape** (the slice becomes a square; the loser keeps
  its new, shorter shape), **fly** (a short bow, a fading trail), **bar** (it
  turns into a bar along the winner's long edge, a gap away), **attach** (the
  gap closes, it takes the winner's colour, the seam fades), **merge** (one
  body again, the bar its new edge). Sizes are never reshaped
  (`stage/core/aspect.ts`): cutting shortens the long side; attaching puts
  the smaller of the two as a bar along the larger's long edge, so people
  drift toward squares by themselves; proportions stay within 1 : 4, and
  `equalize` squares everyone. Every trade changes
  shapes this way, played or not, so links replay them exactly. Streamed (a
  few at a time) or `sync`: rounds, every pair through every beat together.
- *Levy*, everyone at once, trading paused, after the round's trades have
  landed: **brace** (faces shrink and flinch: worry, or anger in the
  dominant), **score** (a cut line like a trade's: across the longer
  dimension, the levy's width, at the end toward the pot), **separate**,
  **shape** (each slice a 2 : 1 bar; the morph is quick and then holds),
  **gather** (biggest first into the pot, an empty square the room keeps in
  its middle, sized to the pot (`potRoom`: a 2 : 1 bar of the levy, plus
  room around it) for the tax's levy, or the levy playing; a bigger levy
  first waits, up to 3 s, while the room walks off the spot; each next piece leaves a step after the last, turns into the bar it
  must be just before it arrives, and attaches on the side that keeps the pot
  squarest, among sides about as good the one used least, so all four sides
  take turns;
  the pot's colour is the payers' colours mixed by amount; all of it in at most
  1.2 s after the first flight; the finished pile centred in the middle),
  **split** (the pile becomes N equal squares in rows, which part), **deal**
  (a square to each person, becoming on the way what it
  joins as: the smaller of share and person a bar along the other's long
  edge), **dock** and **merge** (the gap closes, it takes the person's
  colour, the seam fades). About 3–4 s at speed 1.

**Rounds** (`rule pairing rounds`, the default): each round pairs everyone off
at random (one sits out when N is odd), one trade a pair; played, every pair
goes through every beat together, the next round starts when the last piece
has landed, and a tax's levy plays as its own round after the trades.
`round [k]` plays k rounds; `rule pairing random` is the essay's
YardSaleEngine (one random pair at a time), which `trade k` always uses.

While animations are on, trading is paced by them: a trade happens only when
it can be played, so no size ever changes unseen. Playing into a chart, the
chart forms first (trading waits, at most 6 s), then follows the trades; its
N_eff prints show whole, with the count as it is now. `fx off` trades at full
speed, instantly; shapes follow the same rules either way.

**Hands and views.** `drag push` (shove through the crowd, or stop; whatever
the held body's path meets is shoved along from where they meet, so a step
longer than a small body is wide never passes through it),
`drag lift` (carried over everyone, dropped where there is room, else back),
`drag off`. Pose word `still`: nobody moves by themselves, so people stay
where you put them. `zoom chart`: once formed, the chart fills the screen.
`neff`'s photo (area Σw² = 1/N_eff) is folded to the shape whose frames tile
the 1 × 1 box in the most whole copies (`printGrid`: cols × rows ≤ N_eff,
the photo within 1 : 2.5, then the squarest): each frame is the photo and a
thin empty band above it, as thin as can be (6.5 prints as 3 × 2, each band
7.7%). The prints come one at a time after the photo is ready, row by row,
each framed and numbered 1, 2, 3, …; the count beside the box steps by one
as each lands, and a beat after the last it takes on the bands too: N_eff,
6.5. Frames and counts are drawn over the bodies.

**Scripts.** A script is console lines plus `wait <seconds>`, `until done`
(the pose is finished, or a wandering room is at rest) and `say <text>` (a
line on the stage). Typing a line with `wait` or `until` runs it as a script:
`ccdf; until done; wait 2; neff`. Built-ins live in
`stage/console/scripts.ts` (`run tour`, `scripts tour` shows it, `stop`
stops). A link can carry one: `#run=tour`, or `#script=ccdf;until done;say …`.
The tour's wording is a placeholder.

**Console.** `help`, `help <command>`, `stats` (gini, N_eff, shares),
`check` (the law's counters), `who <i>` (or click someone; drag pushes through
the crowd or stops), `n`, `seed`, `reset`, `play [rate]`, `pause`, `speed`,
`look <face>|off`, `axes`, `hud`, `finish`, `scatter`. Tab completes, ↑/↓
recall. Every command is atomic: a failing one changes nothing. In devtools,
`fns.session()` is the live session and `fns.run(line)` runs a line.

**Files.**

```
index.html, stage/main.ts     the page: canvas, console, pointer (forwards only)
stage/console/session.ts      headless session, command table (atomic, replayable), script runner
stage/console/scripts.ts      built-in scripts: the tour
stage/core/game.ts            wealth, master trade, rules        (rng.ts, stats.ts)
stage/core/recipe.ts          the toolkit's vocabulary, parse/format, presets
stage/core/figure.ts          recipe × wealth → exact target boxes (pure), incl. the spread room
stage/core/shapes.ts          square/rect, triangle, hexagon: area-exact outlines, hit test
stage/core/stage.ts           the physics: walk, give way, hop, glide, contacts, the law
stage/core/area.ts            the arithmetic of areas: cut, join, pile, squares, tile, side rules
stage/core/pack.ts            shell packing and the squarified treemap
stage/core/motion.ts          easing, the bow, every beat's length
stage/core/transfer.ts        moves and transfers: what is drawn while money is shown moving
stage/core/transit.ts         the player: acts on one clock, the ledger, events
stage/core/aspect.ts          proportions: the same cut and join, on a box
stage/acts/track.ts           a piece of money and its steps (mark, lift, … dock, merge)
stage/acts/{piece,toss,levy,prints}.ts   the acts: compositions of the above
stage/acts/scene.ts           what acts draw: pieces, lines, frames, labels, spinners, copies
stage/view/render.ts          canvas: yard, reference box, bodies, prints, dev ticks
stage/view/faces.ts           the essay's FaceField + FacePainter, painted with Path2D
stage/essay/                  the essay's face engine, colours and trade, copied in
tests/*.test.ts               game, figures, the law, room, poses, live charts, hands, console, links,
                              scripts, areas, acts, accounting, packing, renderer (recording canvas),
                              and one regression per review finding (review.test.ts)
```

**Measured** (headless, this laptop): 1,000 people ≈ 1.8 ms per frame at rest
and ≈ 6 ms while forming a CCDF (physics only); the spread room takes up to
13 ms to compute at 1,000 unequal people, and live updates throttle themselves
to stay under a fifth of the time. 36 people: the room is at rest ~1.4 s after
`trade 3000`; every preset forms in ≤ 4 s; back from any pose to the room in
~4 s; a CCDF stays formed in all 600 frames of 10 s of live trading; zero
overlap at every frame throughout. In Chrome, 400 people with faces ran at
about 39 fps; the faces are the main drawing cost.

**Reviews.** `REVIEW-2026-10-18.md` and its recheck; `tests/review.test.ts`
holds one regression per finding.

**Not yet.** Shapes other than boxes collide as their bounding boxes (a hexagon
keeps a small margin); pushes have no rotation; the yard-sale runs between
random pairs, not between neighbours who meet; most people hop rather than
walk into dense poses; a body pressed between a wall and a neighbour in
`wander` can stay a little dense until the crowd moves; no URL compression; no gallery or response capture; no audio.

## Run it

```sh
npm install
npm run dev        # the stage
npm test           # headless tests, one worker
npm run check      # TypeScript, strict
npm run build      # check + production build into dist/
```

Node 22.18+ or 23.6+; any current browser.

History: the stage grew out of a soft-body geometry engine and lab (FnS_de,
2026-10-15), retired on 2026-10-18; only its packers live on, in
`stage/core/pack.ts`.

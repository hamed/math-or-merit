# Storyboard — hand-drawn, promoted from inbox (2026-07-06)

Source: `inbox/story-board-mom-01.pdf` (12 scanned pages, author-drawn) and
`inbox/review.md`, both processed and removed per the inbox workflow. This file is
the durable transcription; the build that realized it is branch
`claude/interactive-build` M0–M10 (see git log).

## Page-by-page transcription

1. **Title page** — empty; teletype types "The world has …" top-left, monospace,
   cursor, source name only in parens, clickable. Then "Is it" / "Merit" / "or" /
   "Math?" fade in one by one, rule of thirds. No frame, no line. Scroll hint.
   Next: "or is it" + beliefs (Luck, Blue eyes, IQ, DNA, Race…) fade in randomly
   placed, size ∝ how strongly people believe. Then: "It is toooo complex, isn't it?"
2. **Cow** — cow → spherical cow → "I'm in vacuum!" (holds breath, looks scared).
   No frame, minimal text, animation and text synced, scroll-driven, only the
   relevant text visible.
3. **Uphill** — someone pushes the sphere up a slope. All smooth animations: things
   are already there, move to place, come in from off-screen, or morph.
4. **Person** — Musk-ish figure (photo or cartoon) → spherical human → just a
   circle → morphs to a grid of coins ("You are your money") → morphs back to one
   circle.
5. **Trade setup** — second circle enters from the side, different color, smaller.
   Each antes; the smaller shrinks by its ante, coin sizes match the money; the two
   antes merge into one larger golden coin. Money is golden yellow.
6. **Coin rule** — coin has two sides, each in one trader's color: no heads/tails
   confusion; it spins, the color that lands wins, pot to winner, repeat so both end
   equal. Then more circles enter (pastel colors; fill and edge can differ), a few
   rounds play at center.
7. **Guess → run** — four candidate outcomes to guess; then run it UNSEEDED, every
   run different, re-runnable; use fill+edge colors to make the headline gag.
   Maybe keep circles from overlapping.
8. **Distribution** — sort small→big → one column → histogram with visible #bins →
   x→log → y→log (stacked counts sketch 16/8/4/2/1). "Also Gini here? using
   histogram."
9. **Scale + game** — start with more money per head so the display covers more
   orders of magnitude (0.01 → 1,000,000). Stack indicator from 1% to 99%. Mini
   game with indicators (game over, Gini, stack); stack increases a bit with each
   click so the game gets harder. Conclusion: "Nothing was fair…"
10. **Tax** — define rules: only tax, no trade (equalizes). Then run many times
    changing params → phase diagram (tax × stake), Gini = 0.5 to make lines, then
    add theoretical lines.
11. **Sandbox** — simulation with histo, Gini, stack, tax, interest (passive
    income), number of people, money, tax steps; progressive tax maybe like an
    equalizer curve.
12. **Gini** — sorted circles → running total (Lorenz) → equal line y = x →
    Gini = ratio of areas (hatched sketch).

## Review decisions (from inbox/review.md)

- Liked: colors, circles, transparency, winner display.
- Scroll-driven; scrolling back reverses. Clean, frameless, text and pictures blend.
- Only a small amount of text visible at a time, synced to the visual.
- Different fill and stroke colors per agent; simple extra shapes (triangle,
  square, pentagon, hexagon — no stars/hearts) for a unique mix; fill colors on the
  coin sides.
- Histogram vs Gini: resolved BOTH, in sequence (owner confirmed 2026-07-06).
- Mini game progressively harder. Full sandbox with all bells and whistles at end.
- GSAP: asked; adopted (owner confirmed 2026-07-06; ADR-013, quarantined).
- Language pass deferred: "text is boring, less is better; we will do that later."
- All of it soft guidelines; target is polish.

/**
 * The script grammar's vocabulary (script/GRAMMAR.md, ADR-019).
 *
 * Code owns these lists. Adding a word here is a grammar change, and grammar
 * changes go back to the owner. Headless: no DOM, no fs, no Svelte.
 */

/** How an action lets go: it plays and the script moves on, or it waits for the reader. */
export type ActionKind = 'authored' | 'reader';

export interface ActionSpec {
  readonly kind: ActionKind;
  /** Braced arguments it takes. */
  readonly args: number;
  /** Takes an optional `[…]` argument. */
  readonly optional?: true;
  /** Doesn't make a step of its own: it sets or checks, it doesn't play. */
  readonly setting?: true;
}

/** Always present, whatever the story. */
const CORE: Record<string, ActionSpec> = {
  params: { kind: 'authored', args: 1, setting: true },
  expect: { kind: 'authored', args: 1, setting: true },
  keep: { kind: 'authored', args: 1, setting: true },
  when: { kind: 'authored', args: 1, setting: true },
  on: { kind: 'authored', args: 1, setting: true },
  pause: { kind: 'authored', args: 0, optional: true },
  choice: { kind: 'reader', args: 2 },
  return: { kind: 'authored', args: 0 },
  pick: { kind: 'authored', args: 1 },
  card: { kind: 'authored', args: 1 },
};

/** The story's actions: what the stage can do, named by what happens, never how. */
const STORY: Record<string, ActionSpec> = {
  reveal: { kind: 'authored', args: 1 },
  hide: { kind: 'authored', args: 1 },
  crowd: { kind: 'authored', args: 1 },
  stake: { kind: 'authored', args: 1 },
  flip: { kind: 'authored', args: 1 },
  run: { kind: 'authored', args: 0, optional: true },
  arrange: { kind: 'authored', args: 1 },
  control: { kind: 'authored', args: 1 },
  levy: { kind: 'authored', args: 1 },
  match: { kind: 'authored', args: 0 },
  /** n rounds, each two from the room stepping out to play the coin, then back (Scene 10); `[pick]`, `[stake]`, `[flip]` play one part of a round, as it is told. */
  pairs: { kind: 'authored', args: 1, optional: true },
  /** A spot on the stage the line is about, by name: ringed, and looked at, while the line shows. */
  point: { kind: 'authored', args: 1 },
  /** Both dials set for the reader to see: `\\rules{stake, levy}`, and the room plays them. */
  rules: { kind: 'authored', args: 1 },
  /** The room moves through its own run to another moment: `start`, `end`, `gini=0.5`. */
  moment: { kind: 'authored', args: 1 },
  /** A card's first n lines, as the reader learns them: `\\learn{rule}{0}` opens it empty. */
  learn: { kind: 'authored', args: 2 },
  /** A picture posted with the bubble, by name (the stage's pictures): the joke's plates. `\image`, since LaTeX's own `\picture` is taken. */
  image: { kind: 'authored', args: 1 },
  pin: { kind: 'authored', args: 1 },
  /** A widget inside a unit — a card's toy — opened on request. */
  toy: { kind: 'authored', args: 1 },
  meet: { kind: 'reader', args: 1 },
  /** *reader*: a round of the tax game — `[tap]`: one tap, to see it; `[still]`: a room that doesn't trade, taxed past n players; else it trades, kept above n as long as the reader can. */
  taxgame: { kind: 'reader', args: 1, optional: true },
  /** *reader*: the four's puzzle — make each number in turn by moving coins (Scene 17). */
  solve: { kind: 'reader', args: 1 },
  equalize: { kind: 'reader', args: 0 },
};

export const ACTIONS: Readonly<Record<string, ActionSpec>> = { ...CORE, ...STORY };

/** `\choice{text}` takes its second argument only when it jumps, answers or acts. */
export const OPTIONAL_LAST_ARG = new Set(['choice']);

/** Inline commands, with how many braced arguments each takes (`val` takes one or two). */
export const INLINE: Readonly<Record<string, { min: number; max: number }>> = {
  emph: { min: 1, max: 1 },
  textbf: { min: 1, max: 1 },
  val: { min: 1, max: 2 },
  plural: { min: 2, max: 2 },
  gls: { min: 1, max: 2 },
  footnote: { min: 1, max: 1 },
  cite: { min: 1, max: 1 },
  ref: { min: 1, max: 1 },
  todo: { min: 1, max: 1 },
  marginpar: { min: 1, max: 1 },
  adapt: { min: 1, max: 1 },
  label: { min: 1, max: 1 },
};

/** Size switches, only as `{\large …}`: emotion by size. */
export const SIZES = new Set(['large', 'Large']);

/** A line that holds only these belongs to the bubble above it, not to its words. */
export const ATTACHMENTS = new Set(['label', 'marginpar', 'todo', 'adapt']);

/** Escapes that stand for one character. */
export const ESCAPES = new Set(['%', '$', '&', '#', '_', '{', '}']);

/** Manner words that change behaviour. Any other word is a delivery hint, and a warning. */
export const MANNERS = new Set(['aside', 'thought', 'teletype', 'wait', 'flow', 'interrupts', 'brief']);

/**
 * Feeling words, written as manners (`Blue (proud): …`): the speaker's face
 * shows it, subtly, as the line is said, and it fades as any feeling does
 * (owner, 2026-10-07). The faces map each one (face/moments.ts `FEELINGS`).
 */
export const FEELINGS = new Set(['glad', 'proud', 'smug', 'amused', 'calm', 'sure', 'curious', 'surprised', 'worried', 'annoyed', 'sad', 'shy', 'tired']);

/** Bubble length, in words, for English (v3 brief): warn above, fail above. */
export const AIM_WORDS = 12;
export const MAX_WORDS = 18;

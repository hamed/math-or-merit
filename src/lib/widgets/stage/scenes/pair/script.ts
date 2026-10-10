/**
 * The pair stage's steps, read from the script (script/*.tex, ADR-019).
 *
 * The script says what happens and in what order: who speaks, in what manner,
 * which words, which actions, which choices, and what plays under which
 * condition. This file turns that into the stage's steps: every step says how
 * it lets go (its wait), what is said (a message key, never words), and the
 * POSE it leaves the stage in — everything the reader can see that the
 * argument depends on. `settle` draws a pose; `play` animates into it. Because
 * poses are data, "every number in the dialogue equals the number on screen" is
 * a unit test, not a hope.
 *
 * The scene addresses a few steps by name (the hold where the reader evens the
 * coins is `equal`). Those names are found here by what the step does, never by
 * where it is: move a line, add one, cut one, and the names follow. Everything
 * else about a step — how long an action plays, how a pose is drawn — is code.
 */
import { HOLDINGS } from './game';
import { ARRIVE_SECONDS, GATHER_SECONDS, RAIN_SECONDS } from './rain';
import { MORE_SPEED, PHASE_SPAN, ROUND_PHASES, windowSeconds, type RoundPhase, type RoundWindow } from './roomRounds';
import { CHAT, HOLD, READER, auto, readingMs, type LineSpec, type StepSpec, type Wait } from '../../steps';
import { STORY } from '../../../../content/story.gen';
import type { StoryBubble, StoryGroup, StoryStep } from '../../../../script/compile';
import { FEELINGS } from '../../../../script/grammar';

/** Scene 2: not here yet · bounced in · coins caught · only the two left. */
export type CrowdState = 'away' | 'idle' | 'paid' | 'two';
export type Place = 'marks' | 'seats' | 'room';
export type Flip = 'hidden' | 'shown' | 'blue' | 'red';
/** What a line can point at (`\\point{…}`, owner 2026-10-09: "when describing a picture, it is nice to highlight"): spots the stage knows by name. */
export const POINTS = ['blue', 'red', 'richest', 'dust', 'diagonal', 'gap', 'pool'] as const;
export type PointAt = (typeof POINTS)[number];

export interface Coins {
  readonly blue: number;
  readonly red: number;
}

export interface Pose {
  /** The news line and its source are typed out. */
  readonly teletype: boolean;
  /** Each title word has arrived (MERIT, or, MATH, and the "?" with the credit), in reading order. */
  readonly merit: boolean;
  readonly or: boolean;
  readonly math: boolean;
  readonly mark: boolean;
  /** From Scene 3: the news line has gone and the title sits small at the top, leaving room to talk. */
  readonly compact: boolean;
  /** Scene 5: the title and every other word have left; only the two remain. */
  readonly cleared: boolean;
  readonly crowd: CrowdState;
  readonly named: { readonly blue: boolean; readonly red: boolean };
  /** Numbers appear (Scene 7): each fortune shown as its coins. */
  readonly coins: boolean;
  /** Coins in each fortune — not counting what is on the table. */
  readonly holdings: Coins;
  /** Coins each has staked on the table. */
  readonly table: Coins;
  readonly flip: Flip;
  /** The decider has been shown, both faces, once (round one): after that it simply appears. */
  readonly presented: boolean;
  /** Rounds the room has played by hand so far (Scene 10's `\\pairs`): the next one draws on from there. */
  readonly played: number;
  /** The spot this step's line points at (`\\point`), for this step only. */
  readonly point: PointAt | null;
  /** How many lines of a card the reader knows so far (`\\learn`); a card not named here shows them all. */
  readonly learned: Readonly<Record<string, number>>;
  readonly place: Place;
  /** How many people are in the room (Scene 14). */
  readonly room: number;
  /** Scene 11's "Yes · Not now", inside Red's bubble. */
  readonly choice: boolean;
  /** Concept cards dropped into the stack so far (brief 1.6), oldest first. */
  readonly cards: readonly string[];
  /** A card the step opens beside the talk ("Remember the rule."). */
  readonly cardOpen: string | null;
  /** Scene 13 onward: the room has been run, and shows how the last run ended. */
  readonly ran: boolean;
  /** How the room stands (Scenes 15–17). */
  readonly roomMode: RoomMode;
  /** How much of the Lorenz picture is drawn: 0 none · 1 the curve · 2 and the diagonal · 3 and the gap. */
  readonly lorenz: 0 | 1 | 2 | 3;
  /** The running total's curve is drawn (walked); undone, the diagonal and the plot stay. */
  readonly curve: boolean;
  /** The stake's chart counts time in stake squared (`\\reveal{scaled}`): the three rooms on one curve. */
  readonly scaled: boolean;
  /**
   * Where in its run the room stands (`\\moment`, owner 2026-10-10): `start`,
   * `end`, or `gini=0.5` (the first moment its Gini reaches 0.5). The
   * histograms and the Gini plot hold still; only the room moves.
   */
  readonly time: string;
  /** Small pictures of concepts already built, in the side rail (brief 5.3). */
  readonly thumbs: readonly string[];
  /**
   * The measures pinned while the matched rooms stand (Scene 23): each drawn
   * for both rooms, without the levy beside with it (owner, 2026-10-09: "red
   * and blue also review what happens with the levy").
   */
  readonly compare: readonly string[];
  /**
   * Whose fortunes the room shows: the run of Scene 13 (played on in Scene
   * 19) · the dial's fresh room (20) · the tax game, live (21–22) · the
   * matched pair, trades only on the left (23) · the reader's own machine (26).
   */
  readonly source: RoomSource;
  /** A control the reader holds in this step: the stake dial, the tax game, the whole machine. */
  readonly control: 'stake' | 'tax' | 'sandbox' | 'rules' | null;
  /** The two dials of Scene 24 (`\\rules{stake, levy}`): the pair Red sets for the reader to see. */
  readonly rules: { readonly stake: number; readonly levy: number } | null;
  /** Scene 22's lesson: 0 before · 1 a quarter of every pile in the pool · 2 the pool shared back. */
  /** The four's coins: before · all paid a quarter · shared back · one tapped (the tax game's tap) · its quarter shared back. */
  readonly levy: LevyMoment;
  /** Scene 24: 0 no map · 1 every square filled in · 2 and the fitted curve. */
  readonly map: 0 | 1 | 2;
}

export type RoomSource = 'run' | 'dial' | 'game' | 'pair' | 'sandbox';

/**
 * How the room stands (ADR-018 room poses): scattered as people · dropped into
 * piles on an ordinary ruler · on a multiplying ruler · in a line, poorest
 * first · the imagined cases of Scene 17 (all equal; one emptied; that one's
 * money given to one other; half owning it all; one owner) · four stepped out
 * of the crowd with coins · dimmed under the turnover chart · four with the
 * levy lesson's coins (Scene 22) · two rooms side by side on the same luck
 * (23) · stepped back behind the outcome map (24).
 */
export type RoomMode =
  | 'free'
  | 'piles'
  | 'ruler'
  | 'line'
  | 'equal'
  | 'zero'
  | 'halves'
  | 'half'
  | 'one'
  | 'four'
  | 'turnover'
  | 'scaling'
  | 'levy4'
  | 'matched'
  | 'map';

/** What a step does on the way in, for the scene's choreography. */
export type Action =
  | 'type'
  | 'arrive'
  | 'merit'
  | 'or'
  | 'reel-math'
  | 'payout'
  | 'gather'
  | 'lattice'
  | 'clear'
  | 'ante'
  | 'toss'
  | 'present'
  | 'room'
  | 'pairs'
  | 'run'
  | 'arrange'
  | 'walk'
  | 'unwalk'
  | 'rescale'
  | 'rules'
  | 'time'
  | 'dial'
  | 'game'
  | 'coins'
  | 'match'
  | 'map'
  | 'empty';

export interface PairStep extends StepSpec {
  readonly pose: Pose;
  readonly action?: Action;
  /** Clears the talk: a new scene (every `\\subsection`), a new conversation (owner, 2026-10-09). */
  readonly panel?: true;
  /** Starts a part of the story (a `\\section`): what the phone rail and the index count by. */
  readonly act?: true;
  /** Its line goes as soon as the next one is said. */
  readonly brief?: true;
  /**
   * Said to the reader (or to nobody) rather than to the other one: it sits on
   * the speaker's outer side, not in the middle where the two talk to each
   * other (owner review 2026-09-26).
   */
  readonly aside?: true;
  /** A message logged in the talk once the step's action is over (the toss result). */
  readonly log?: string;
  /** The feeling words its line is said with (script grammar `FEELINGS`): they show on the speaker's face. */
  readonly feel?: readonly string[];
  /** A chit-chat step's `\\pause[n]`, ms: it stays this much longer than its words take to read. */
  readonly pauseMs?: number;
  /** How long its action plays, ms: a chit-chat step stays until its words are read and its action is done. */
  readonly actionMs?: number;
  /** `\\pairs`: the stretch of the room's demonstration rounds this step plays (roomRounds.ts). */
  readonly rounds?: RoundWindow;
  /**
   * `\\taxgame`: a round of the tax game (owner, 2026-10-10): `tap` — one tap on
   * the biggest, to see what it does; `still` — the room not trading, made
   * equal past `target` players; `live` — it trades, kept above `target`.
   */
  readonly taxgame?: { readonly kind: 'tap' | 'still' | 'live'; readonly still: boolean; readonly target: number };
  /** `\\solve{2, 1, 2.9}`: the numbers the reader makes in turn, moving the four's coins (Scene 17). */
  readonly solve?: readonly number[];
  /** The pictures posted with its line (`\\image{name}`), by name. */
  readonly pictures?: readonly string[];
}

// ---- decl.tex's numbers: the only absolute times the script sets (GRAMMAR.md §6) ----------

/** One beat, seconds: `\\pause[n]` is n of them, and the reel's holds count in them. */
const BEAT = STORY.timing.beat ?? 0.6;

/** How long a line of `words` stays before moving on by itself, ms: decl.tex's `max(minread, words × perword)`. */
export const readFor = (words: number): number => readingMs(words, STORY.timing.perword, STORY.timing.minread);

/** How long the stage waits before it nudges again: a caller who has not been clicked calls once more, a little louder. */
export const NUDGE_MS = Math.round((STORY.timing.nudge ?? 4) * 1000);

/** A step's pauses (`\\pause`, `\\pause[n]`), ms, at `beat` seconds a beat. */
export function pauseOf(s: Pick<StoryStep, 'cues'>, beat = BEAT): number {
  let beats = 0;
  for (const c of s.cues) if (c.name === 'pause') beats += Number.isFinite(Number(c.opt ?? 1)) ? Number(c.opt ?? 1) : 1;
  return Math.round(beats * beat * 1000);
}

/** The stage before its first step: nothing typed, nobody here. */
export const START: Pose = {
  teletype: false,
  merit: false,
  or: false,
  math: false,
  mark: false,
  compact: false,
  cleared: false,
  crowd: 'away',
  named: { blue: false, red: false },
  coins: false,
  holdings: { blue: 15, red: 1 },
  table: { blue: 0, red: 0 },
  flip: 'hidden',
  presented: false,
  played: 0,
  point: null,
  learned: {},
  place: 'marks',
  room: 2,
  choice: false,
  cards: [],
  cardOpen: null,
  ran: false,
  roomMode: 'free',
  lorenz: 0,
  curve: false,
  scaled: false,
  rules: null,
  time: 'end',
  thumbs: [],
  compare: [],
  source: 'run',
  control: null,
  levy: 0,
  map: 0,
};


const held = (i: number): Coins => ({ blue: HOLDINGS[i].a, red: HOLDINGS[i].b });
const NOTHING: Coins = { blue: 0, red: 0 };

/**
 * Scene 22's four, in the room's cast order (Blue, Red, then two others): coins
 * before the levy. The average is eight.
 */
export const LEVY_COINS: readonly number[] = [16, 4, 8, 4];
export const LEVY_RATE = 0.25;

/**
 * The levy lesson's moments. On four people (`levy4`): before · all paid a
 * quarter · shared back. On the room, step by step (owner, 2026-10-10: "pause
 * and describe each step"): 1 a coin appears on everyone, sized to their
 * quarter, and they shrink · 2 the coins in the pool, one coin · 3 it divides
 * in place, one part for each · 4 a part on each · 5 taken in, they grow.
 */
export type LevyMoment = 0 | 1 | 2 | 3 | 4 | 5;
/** The moment a four-person lesson's coins move from. */
export const LEVY_FROM: Readonly<Record<LevyMoment, LevyMoment>> = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

/**
 * The four's coins and the pool at each moment of the lesson: before ·
 * collected from all · shared back · and the tax game's tap shown first
 * (owner, 2026-10-10: "before that put what the tax is"): a quarter of the
 * biggest pile only, then that quarter shared back.
 */
export function levyLesson(stage: LevyMoment): { coins: number[]; pool: number } {
  const taken = LEVY_COINS.map((c) => c * LEVY_RATE);
  const pool = taken.reduce((sum, c) => sum + c, 0);
  if (stage === 0) return { coins: [...LEVY_COINS], pool: 0 };
  if (stage === 1) return { coins: LEVY_COINS.map((c, k) => c - taken[k]), pool };
  return { coins: LEVY_COINS.map((c, k) => c - taken[k] + pool / LEVY_COINS.length), pool: 0 };
}

/** How long the rain step lasts: every drop, the last fall, and a moment to stand still (rain.ts). */
export const RAIN_WAIT_MS = Math.round(RAIN_SECONDS * 1000);
/** The decider's first showing: plain, then in its colours, turning slowly so both faces are seen, at rest on Marx (PairScene `present`). */
export const PRESENT_MS = 3600;
/** The walk along the line, adding up as it goes, and its undoing, seconds. */
export const WALK_SECONDS = 4.2;
/** The room moving through its run to another moment (`\\moment`), seconds. */
export const TIME_SECONDS = 3.2;

/** How long the run takes on screen, ms: slow enough to see it happen (brief Scene 13). */
export const RUN_MS = 16_000;


// ---- the steps the scene addresses by name, found by what they do ------------------

const cue = (s: StoryStep, name: string, arg?: string) => s.cues.some((c) => c.name === name && (arg === undefined || c.args[0] === arg) && !c.opt);
const targets = (s: StoryStep, target: string) => s.choices.some((c) => c.target === target);
const answers = (s: StoryStep, fact: string) => s.choices.some((c) => c.target.startsWith(`${fact}=`));
const when = (s: StoryStep, fact: string) => !!s.groups?.some((g) => g.cond.kind === 'when' && g.cond.name === fact);
const needs = (s: StoryStep, value: string) => !!s.vals?.includes(value);

/**
 * name → what the step does, never where it is or what its scene is called:
 * the owner renames scenes and moves lines. Each must match exactly one step
 * of the script (a test holds it).
 */
export const ROLES: Readonly<Record<string, (s: StoryStep) => boolean>> = {
  'title.type': (s) => s.manner.includes('teletype'),
  'title.math': (s) => cue(s, 'reveal', 'math'),
  // both call at once: one step, the reader clicks either first
  meet: (s) => cue(s, 'meet'),
  equal: (s) => cue(s, 'equalize'),
  // the joke offer: "Yes" goes on into the joke, "Not now" past it (owner, 2026-10-09: the joke is part of the chat)
  'more.joke': (s) => answers(s, 'joke'),
  'guess.what': (s) => answers(s, 'prediction'),
  'guess.stake': (s) => answers(s, 'bet'),
  'guess.react': (s) => when(s, 'bet'),
  run: (s) => !s.who && cue(s, 'run'),
  'run.banter': (s) => when(s, 'winner'),
  'run.again': (s) => targets(s, '\\run'),
  'why.after': (s) => when(s, 'runs'),
  'sort.there': (s) => needs(s, 'count') && cue(s, 'point', 'blue') && s.choices.length === 0,
  'gini.value': (s) => needs(s, 'gini'),
  'gini.toy': (s) => targets(s, '\\reveal{toy:gini}'),
  'eff.brutal': (s) => cue(s, 'arrange', 'zero'),
  'eff.halves': (s) => cue(s, 'arrange', 'halves'),
  'eff.half': (s) => cue(s, 'arrange', 'half'),
  'eff.one': (s) => cue(s, 'arrange', 'one'),
  'eff.room': (s) => needs(s, 'count') && cue(s, 'arrange', 'free') && !cue(s, 'card'),
  'eff.try': (s) => cue(s, 'arrange', 'four'),
  'eff.end': (s) => cue(s, 'card', 'participants'),
  'turn.busy': (s) => needs(s, 'trades'),
  'turn.start': (s) => needs(s, 'early'),
  'turn.now': (s) => needs(s, 'late'),
  'end.longer': (s) => targets(s, '\\run[longer]'),
  'dial.said': (s) => when(s, 'stake'),
  // the tax game's two rounds (owner, 2026-10-10): a room standing still, then one that trades
  'stop.tap': (s) => s.cues.some((c) => c.name === 'taxgame' && c.opt === 'tap'),
  'stop.still': (s) => s.cues.some((c) => c.name === 'taxgame' && c.opt === 'still'),
  'stop.how': (s) => s.cues.some((c) => c.name === 'taxgame' && c.opt === undefined),
  'match.result': (s) => needs(s, 'a'),
  'map.all': (s) => cue(s, 'reveal', 'map'),
  'sandbox.2': (s) => targets(s, 'workshop'),
};

/** The title's reel, as the script lists it under \\reveal{math}. */
const REEL_STEP: StoryStep | undefined = STORY.steps.find((s) => ROLES['title.math'](s));
export const REEL: readonly string[] = REEL_STEP?.body ?? [];
/** Where the reel lands (the word in bold), and how many seconds each word holds. */
export const REEL_ANSWER: number = REEL_STEP?.bodyAnswer ?? Math.max(0, REEL.length - 2);
export const REEL_HOLDS: readonly number[] = (REEL_STEP?.bodyHolds ?? []).map((beats) => beats * BEAT);

/**
 * The reel's spin, as tweens of its position (owner, 2026-10-07): after the
 * first word's hold, one slow run to the last word — gathering speed,
 * cruising, slowing to a stop on it — a beat there, and then, slowly, back to
 * the answer. A hold the script gives a word in the middle stops the run there
 * too. The scene plays it; the step waits for it.
 */
export function reelSpin(): { to: number; seconds: number; ease: string }[] {
  const last = REEL.length - 1;
  const out: { to: number; seconds: number; ease: string }[] = [];
  if (REEL_HOLDS[0]) out.push({ to: 0, seconds: REEL_HOLDS[0], ease: 'none' });
  const stops = [...REEL_HOLDS.flatMap((hold, i) => (hold && i > 0 && i < last ? [i] : [])), last];
  let at = 0;
  for (const to of stops) {
    // about two words a second on average; four at the fastest, in the middle of the run
    out.push({ to, seconds: 0.6 + (to - at) / 2.2, ease: 'power2.inOut' });
    if (REEL_HOLDS[to] && to < last) out.push({ to, seconds: REEL_HOLDS[to], ease: 'none' });
    at = to;
  }
  if (last > REEL_ANSWER) {
    // a beat on the wrong word, then slowly back
    out.push({ to: last, seconds: 0.45 + (REEL_HOLDS[last] ?? 0), ease: 'none' });
    out.push({ to: REEL_ANSWER, seconds: 0.8 + 0.4 * (last - REEL_ANSWER), ease: 'sine.inOut' });
  }
  return out;
}
/** Which name each step of the script answers to, and the steps no name matched. */
function name(steps: readonly StoryStep[]): { ids: string[]; problems: string[] } {
  const ids = steps.map((s) => s.id);
  const problems: string[] = [];
  for (const [role, test] of Object.entries(ROLES)) {
    const found = steps.flatMap((s, i) => (test(s) ? [i] : []));
    if (found.length !== 1) problems.push(`the stage needs exactly one step that is "${role}"; the script has ${found.length}`);
    else ids[found[0]] = role;
  }
  return { ids, problems };
}

/** Steps whose words the scene computes from the room on screen (Scenes 15–23), so they carry no line of their own. */
const SPOKEN = new Set(['sort.there', 'gini.value', 'eff.brutal', 'eff.halves', 'eff.half', 'eff.one', 'eff.room', 'eff.end', 'turn.busy', 'turn.start', 'turn.now', 'match.result']);

// ---- a step's actions → the pose it leaves, and how long it plays ----------------------

/** How long an authored action plays, ms: the choreography's own length (code, never the script). */
function durationOf(action: Action | undefined, pose: Pose, prev: Pose): number {
  switch (action) {
    case 'type':
      return 4600;
    case 'arrive':
      // everyone is home and settled by then (rain.ts `planArrival`), whatever the stage's size
      return Math.round((ARRIVE_SECONDS + 0.2) * 1000);
    case 'merit':
      return 1500;
    case 'or':
      return 900;
    case 'reel-math':
      return Math.round((0.25 + reelSpin().reduce((t, x) => t + x.seconds, 0) + 0.9) * 1000);
    case 'payout':
      return RAIN_WAIT_MS;
    case 'gather':
      // everyone else bounds off at their own gait; Blue and Red hop under their words (hops.ts)
      return Math.round((GATHER_SECONDS + 0.2) * 1000);
    case 'clear':
      return 1500;
    case 'toss':
      return 3600;
    case 'present':
      return PRESENT_MS;
    case 'walk':
    case 'unwalk':
      return Math.round(WALK_SECONDS * 1000) + 200;
    case 'time':
      return Math.round(TIME_SECONDS * 1000) + 200;
    case 'rescale':
      return 2600;
    case 'rules':
      return 6800;
    case 'arrange':
      return pose.roomMode === 'piles' ? 4800 : pose.roomMode === 'ruler' ? 3400 : prev.roomMode === 'turnover' ? 1800 : 2000;
    default:
      return 1500;
  }
}

/** A check the script asks for (\\expect) that the pose does not meet. Empty when the script and the stage agree. */
export const EXPECT_PROBLEMS: string[] = [];

/** What a step's actions do to the stage. */
function apply(s: StoryStep, prev: Pose): { pose: Pose; action?: Action; log?: string; rounds?: RoundWindow } {
  let p: Pose = { ...prev, choice: answers(s, 'joke'), point: null };
  let action: Action | undefined;
  let log: string | undefined;
  let rounds: RoundWindow | undefined;
  if (s.manner.includes('teletype')) [p, action] = [{ ...p, teletype: true }, 'type'];
  for (const c of [...s.cues, ...(s.together ?? []).flatMap((t) => t.cues)]) {
    const [arg = ''] = c.args;
    switch (`${c.name}${c.opt !== undefined ? `[${c.opt}]` : ''}:${arg}`) {
      case 'crowd:idle':
        [p, action] = [{ ...p, crowd: 'idle' }, 'arrive'];
        break;
      case 'crowd:payout':
        [p, action] = [{ ...p, crowd: 'paid' }, 'payout'];
        break;
      case 'crowd:two':
        [p, action] = [{ ...p, crowd: 'two' }, 'gather'];
        break;
      case 'crowd:room':
        [p, action] = [{ ...p, place: 'room', room: 100 }, 'room'];
        break;
      case 'crowd:empty':
        p = { ...p, place: 'seats', holdings: held(0), table: NOTHING, flip: 'hidden', roomMode: 'free', source: 'run', map: 0 };
        action = 'empty';
        break;
      case 'reveal:merit':
        [p, action] = [{ ...p, merit: true }, 'merit'];
        break;
      case 'reveal:or':
        [p, action] = [{ ...p, or: true }, 'or'];
        break;
      case 'reveal:math':
        [p, action] = [{ ...p, math: true }, 'reel-math'];
        break;
      case 'reveal:mark':
        p = { ...p, mark: true };
        break;
      case 'reveal:coins':
        [p, action] = [{ ...p, coins: true }, 'lattice'];
        break;
      case 'reveal:coin':
        // the first time, it comes out and turns to show both faces (owner, 2026-10-09)
        if (!p.presented) action = 'present';
        p = { ...p, flip: 'shown', presented: true };
        break;
      case 'reveal:scaled':
        [p, action] = [{ ...p, scaled: true }, 'rescale'];
        break;
      case 'reveal:curve':
        [p, action] = [{ ...p, lorenz: Math.max(1, p.lorenz) as Pose['lorenz'], curve: true }, 'walk'];
        break;
      case 'hide:curve':
        // the walk undone, exactly in reverse
        [p, action] = [{ ...p, curve: false }, 'unwalk'];
        break;
      case 'reveal:diagonal':
        p = { ...p, lorenz: 2 };
        break;
      case 'reveal:gap':
        p = { ...p, lorenz: 3 };
        break;
      case 'reveal:map':
        [p, action] = [{ ...p, roomMode: 'map', map: 1 }, 'map'];
        break;
      case 'reveal:fit':
        p = { ...p, map: 2 };
        break;
      case 'hide:headline':
        p = { ...p, compact: true };
        break;
      case 'hide:words':
        [p, action] = [{ ...p, cleared: true, place: 'seats' }, 'clear'];
        break;
      case 'hide:coin':
        p = { ...p, flip: 'hidden' };
        break;
      case 'hide:lorenz':
        p = { ...p, lorenz: 0, curve: false };
        break;
      case 'meet:red':
      case 'meet:blue':
        p = { ...p, named: { ...p.named, [arg]: true } };
        break;
      case 'equalize:':
        p = { ...p, holdings: held(0) };
        break;
      case 'run:':
        [p, action, log] = [{ ...p, ran: true }, 'run', 'log_run'];
        break;
      case 'control:stake':
        [p, action] = [{ ...p, control: 'stake', source: 'dial' }, 'dial'];
        break;
      case 'control:tax':
        [p, action] = [{ ...p, control: 'tax', source: 'game' }, 'game'];
        break;
      case 'control:rules':
        // both dials in the reader's hand: one room, the stake and the levy
        [p, action] = [{ ...p, control: 'rules', source: 'dial', roomMode: 'free' }, 'rules'];
        break;
      case 'control:sandbox':
        p = { ...p, control: 'sandbox', source: 'sandbox' };
        break;
      case 'control:none':
        // the reader's hand leaves the tax game: the room shown is the run's again
        p = { ...p, control: null, ...(p.control === 'tax' || p.control === 'rules' ? { source: 'run' as const } : {}) };
        break;
      case 'levy:collect':
        // on the room itself (owner, 2026-10-10: no four-person demo): the run's own room pays
        [p, action] = [{ ...p, levy: 1, ...(p.roomMode === 'free' ? { source: 'run' as const, control: null } : {}) }, 'coins'];
        break;
      case 'levy:pool':
        [p, action] = [{ ...p, levy: 2 }, 'coins'];
        break;
      case 'levy:split':
        [p, action] = [{ ...p, levy: 3 }, 'coins'];
        break;
      case 'levy:share':
        [p, action] = [{ ...p, levy: 4 }, 'coins'];
        break;
      case 'levy:return':
        [p, action] = [{ ...p, levy: p.roomMode === 'levy4' ? 2 : 5 }, 'coins'];
        break;
      case 'match:':
        [p, action] = [{ ...p, roomMode: 'matched', source: 'pair', levy: 0, compare: [] }, 'match'];
        break;
      default:
        if (c.name === 'reveal' && arg.startsWith('card:')) p = { ...p, cardOpen: arg.slice(5) };
        else if (c.name === 'hide' && arg.startsWith('card:')) p = { ...p, cardOpen: null };
        else if (c.name === 'stake') {
          const n = Number(arg);
          [p, action] = [{ ...p, table: { blue: n, red: n }, holdings: { blue: p.holdings.blue - n, red: p.holdings.red - n } }, 'ante'];
        } else if (c.name === 'flip') {
          const pot = p.table.blue + p.table.red;
          const side = arg as 'blue' | 'red';
          p = { ...p, flip: side, table: NOTHING, holdings: { ...p.holdings, [side]: p.holdings[side] + pot } };
          [action, log] = ['toss', 'log_toss'];
        } else if (c.name === 'pairs') {
          // the room plays a few rounds by hand before it plays by itself; nothing it does is kept.
          // A part of a round is told as it plays; whole rounds after a told one go quicker.
          const phase = c.opt as RoundPhase | undefined;
          if (phase !== undefined && !ROUND_PHASES.includes(phase)) EXPECT_PROBLEMS.push(`${s.at}: \\pairs[${phase}] — a part is one of ${ROUND_PHASES.join(', ')}`);
          if (phase && ROUND_PHASES.includes(phase)) {
            const [from, to] = PHASE_SPAN[phase];
            rounds = { first: p.played, count: 1, from, to, speed: 1 };
            if (phase === 'flip') p = { ...p, played: p.played + 1 };
          } else {
            const count = Math.max(1, Math.round(Number(arg) || 1));
            rounds = { first: p.played, count, from: 'start', to: 'end', speed: p.played > 0 ? MORE_SPEED : 1 };
            p = { ...p, played: p.played + count };
          }
          action = 'pairs';
        } else if (c.name === 'rules') {
          const [stake, levy] = arg.split(',').map((x) => Number(x.trim()));
          if (!(stake > 0 && stake <= 1 && levy >= 0 && levy <= 1)) EXPECT_PROBLEMS.push(`${s.at}: \\rules{${arg}} — a stake in (0, 1], a levy in [0, 1]`);
          [p, action] = [{ ...p, rules: { stake, levy } }, 'rules'];
        } else if (c.name === 'moment') {
          if (!/^(start|end|gini=0?\.\d+)$/.test(arg)) EXPECT_PROBLEMS.push(`${s.at}: \\moment{${arg}} — start, end or gini=0.5`);
          [p, action] = [{ ...p, time: arg }, 'time'];
        } else if (c.name === 'point') {
          if (!(POINTS as readonly string[]).includes(arg)) EXPECT_PROBLEMS.push(`${s.at}: \\point{${arg}} — the stage can point at ${POINTS.join(', ')}`);
          else p = { ...p, point: arg as PointAt };
        } else if (c.name === 'learn') {
          // the card opens, and shows as many of its lines as the reader has been told
          const [id = '', n = ''] = c.args.map((x) => x.trim());
          const lines = STORY.cards[id]?.blocks.length;
          const count = Number(n);
          if (lines === undefined || !Number.isInteger(count) || count < 0 || count > lines) EXPECT_PROBLEMS.push(`${s.at}: \\learn{${id}}{${n}} — the card has ${lines ?? 'no'} lines`);
          p = { ...p, learned: { ...p.learned, [id]: count }, cards: p.cards.includes(id) ? p.cards : [...p.cards, id], cardOpen: id };
        } else if (c.name === 'arrange') {
          // the matched pair's mirror goes once the room is arranged again
          p = {
            ...p,
            roomMode: arg as RoomMode,
            ...(p.source === 'pair' ? { source: 'run' as const } : {}),
            ...(arg === 'levy4' ? { levy: 0 as const } : {}),
            ...(arg === 'scaling' ? { scaled: false } : {}),
          };
          action = 'arrange';
        } else if (c.name === 'card') p = { ...p, cards: [...p.cards, arg] };
        else if (c.name === 'pin') p = p.roomMode === 'matched' ? { ...p, compare: [...p.compare, arg] } : { ...p, thumbs: [...p.thumbs, arg] };
        else if (c.name === 'expect') {
          const want = Object.fromEntries(arg.split(',').map((kv) => kv.split('=').map((x) => x.trim())));
          for (const [k, v] of Object.entries(want)) {
            const got = (p.holdings as unknown as Record<string, number>)[k];
            if (got !== Number(v)) EXPECT_PROBLEMS.push(`${s.at}: \\expect{${arg}} but ${k} holds ${got}`);
          }
        }
    }
  }
  if (answers(s, 'prediction')) log = 'log_guess';
  if (answers(s, 'bet')) log = 'log_bet';
  return { pose: p, ...(action ? { action } : {}), ...(log ? { log } : {}), ...(rounds ? { rounds } : {}) };
}

const flowing = (groups: readonly StoryGroup[] | undefined, manner: string) => !!groups?.every((g) => g.bubbles.every((b) => b.manner.includes(manner)));

function build(): { steps: PairStep[]; problems: string[] } {
  const { ids, problems } = name(STORY.steps);
  let pose = START;
  const steps = STORY.steps.map((s, i): PairStep => {
    const prev = pose;
    const { pose: next, action, log, rounds } = apply(s, prev);
    const pause = pauseOf(s);
    const played = action === 'pairs' && rounds ? Math.round(windowSeconds(rounds) * 1000) : durationOf(action, next, prev);
    pose = next;
    const id = ids[i];
    const conditioned = s.wait === 'when';
    const wait: Wait =
      s.wait === 'action'
        ? HOLD
        : s.wait === 'chat'
          ? CHAT
          : s.wait === 'reader'
            ? READER
            : conditioned
              ? flowing(s.groups, 'flow')
                ? CHAT
                : READER
              : action === 'run'
                ? CHAT
                : // a pause on its own is its beats; with an action, the beats come after it
                  auto(pause && !action ? pause : played + pause);
    const message = s.variants?.keys[0] ?? s.key;
    const speaks = s.who && message && id !== 'title.type' && !SPOKEN.has(id);
    const aside = conditioned ? flowing(s.groups, 'aside') : s.manner.includes('aside');
    const feel = s.manner.filter((m) => FEELINGS.has(m));
    const pictures = picturesOf(s.cues);
    const solve = s.cues.find((c) => c.name === 'solve')?.args[0]?.split(',').map((x) => Number(x.trim()));
    const tax = s.cues.find((c) => c.name === 'taxgame');
    const kind = tax?.opt === 'tap' ? 'tap' : tax?.opt === 'still' ? 'still' : 'live';
    const taxgame = tax ? { kind, still: kind !== 'live', target: Number(tax.args[0]) } as const : undefined;
    return {
      id,
      wait,
      pose: next,
      ...(speaks ? { lines: [{ who: s.who as LineSpec['who'], message: message! }] } : {}),
      ...(action ? { action } : {}),
      ...(i > 0 && s.scene !== STORY.steps[i - 1].scene ? { panel: true as const } : {}),
      ...(s.act && i > 0 ? { act: true as const } : {}),
      ...(s.manner.includes('brief') ? { brief: true as const } : {}),
      ...(aside ? { aside: true as const } : {}),
      ...(log ? { log } : {}),
      ...(speaks && feel.length ? { feel } : {}),
      ...(pause && wait.kind === 'chat' ? { pauseMs: pause } : {}),
      ...(action && action !== 'run' ? { actionMs: played } : {}),
      ...(rounds ? { rounds } : {}),
      ...(speaks && pictures.length ? { pictures } : {}),
      ...(solve?.length ? { solve } : {}),
      ...(taxgame ? { taxgame } : {}),
    };
  });
  return { steps, problems };
}

const BUILT = build();

export const PAIR_STEPS: readonly PairStep[] = BUILT.steps;

/** What the script asks of the stage that it cannot do: a missing name, a doubled one. Empty when they agree. */
export const ROLE_PROBLEMS: readonly string[] = BUILT.problems;

export const indexOf = (id: string): number => PAIR_STEPS.findIndex((step) => step.id === id);

/** The last step of the part of the story (the act) that holds a step. */
export function actEnd(id: string): number {
  for (let i = indexOf(id) + 1; i < PAIR_STEPS.length; i++) if (PAIR_STEPS[i].act) return i - 1;
  return PAIR_STEPS.length - 1;
}

/** The story's step for a stage step (same index). */
const storyOf = (id: string): StoryStep => STORY.steps[indexOf(id)];

/** The step an act or scene label starts at: `guess` → the first step of Scene 12. */
export function labelStep(label: string): string {
  const at = STORY.steps.findIndex((s) => s.id === STORY.labels[label]);
  return at >= 0 ? PAIR_STEPS[at].id : label;
}

/** Live values a line needs, taken from the pose on screen — never typed in. */
export function valuesFor(step: PairStep): Record<string, number> {
  return { blue: step.pose.holdings.blue, red: step.pose.holdings.red };
}


// ---- the lines the scene speaks on events, as the scene has always asked for them ------

type Said = { who: 'blue' | 'red'; message: string; pauseMs?: number; pictures?: readonly string[]; feel?: readonly string[] };

/**
 * The live values a line may say while the matched rooms stand (Scene 23's
 * review): the levy, and each measure for both rooms — A without the levy, B
 * with it. The scene computes each one from the rooms on screen.
 */
export const MATCHED_VALUES = ['levy', 'a', 'b', 'giniA', 'giniB', 'topA', 'topB', 'turnA', 'turnB'] as const;
export type MatchedValue = (typeof MATCHED_VALUES)[number];

/** The pictures a step's or a bubble's cues post (`\\image{name}`), in order. */
export function picturesOf(cues: readonly { readonly name: string; readonly args: readonly string[] }[]): string[] {
  return cues.flatMap((c) => (c.name === 'image' && c.args[0] ? [c.args[0].trim()] : []));
}

/** A bubble the scene speaks when something happens, with its own `\\pause`, pictures and feelings. */
export function spoken(b: StoryBubble): Said {
  const pause = pauseOf({ cues: b.cues ?? [] });
  const pictures = picturesOf(b.cues ?? []);
  const feel = (b.manner ?? []).filter((m) => FEELINGS.has(m));
  return {
    who: b.who as Said['who'],
    message: b.key,
    ...(pause ? { pauseMs: pause } : {}),
    ...(pictures.length ? { pictures } : {}),
    ...(feel.length ? { feel } : {}),
  };
}
const bubbleOf = spoken;
const group = (id: string, kind: 'groups' | 'reactions', cond: string): Said[] =>
  (storyOf(id)[kind] ?? []).filter((g) => (g.cond.value ?? g.cond.name) === cond).flatMap((g) => g.bubbles.map(bubbleOf));
const lineOf = (id: string): Said => ({ who: storyOf(id).who as Said['who'], message: storyOf(id).key! });
const choices = (id: string) => storyOf(id).choices.map((c) => c.key);
const firstOf = (id: string, kind: 'groups' | 'reactions', cond: string): Said => group(id, kind, cond)[0];
const readoutOf = (): Said => bubbleOf(storyOf('eff.try').beside!);
/** The bubble of the meeting that waits for a click on `who`. */
const callerStep = (who: string): StoryStep => [storyOf('meet'), ...(storyOf('meet').together ?? [])].find((t) => t.cues.some((c) => c.name === 'meet' && c.args[0] === who))!;

/**
 * Lines the scene speaks on EVENTS inside a hold rather than as steps, or
 * chooses by what happened: the caller trying again (Scene 3), the reactions
 * while coins move (Scene 5), the answers and their replies (Scene 12), the
 * banter by who won (Scene 13), and the rest. All of it is written in the
 * script, where it plays; this is the scene's index into it.
 */
/** Where the joke's "Not now" goes: the step its choice names (`\\choice{Not now}{guess}`). */
export const JOKE_SKIP: string = labelStep(storyOf('more.joke').choices.find((c) => c.target && !c.target.includes('='))?.target ?? '');

export const REACTIONS = {
  callRed: callerStep('red').variants!.keys,
  callBlue: callerStep('blue').variants!.keys,
  /** Each one's introduction, once the reader has clicked him. */
  introRed: firstOf('meet', 'reactions', 'met-red'),
  introBlue: firstOf('meet', 'reactions', 'met-blue'),
  equalFirst: firstOf('equal', 'reactions', 'first-move'),
  equalEleven: firstOf('equal', 'reactions', 'blue-reaches-eleven'),
  equalOverBlue: group('equal', 'reactions', 'red-above-eight')[0],
  equalOverRed: group('equal', 'reactions', 'red-above-eight')[1],
  /** Scene 11's "Yes · Not now". */
  joke: choices('more.joke'),
  /** The joke's end: the spherical human, or on. */
  /** Scene 12: the four outcomes, in the order of PREDICTIONS; the four bets, in the order of BETS. */
  guesses: choices('guess.what'),
  bets: choices('guess.stake'),
  /** Scene 13: the banter after a run, by who finished richest. */
  runBanter: { other: group('run.banter', 'groups', 'other'), blue: group('run.banter', 'groups', 'blue'), red: group('run.banter', 'groups', 'red') },
  runChoices: choices('run.again'),
  /** Scenes 15–17: lines whose words carry what the room on screen shows. */
  sortThere: lineOf('sort.there'),
  giniValue: lineOf('gini.value'),
  effRoom: lineOf('eff.room'),
  effCases: {
    'eff.brutal': lineOf('eff.brutal'),
    'eff.halves': lineOf('eff.halves'),
    'eff.half': lineOf('eff.half'),
    'eff.one': lineOf('eff.one'),
    'eff.room': lineOf('eff.room'),
  },
  turnBusy: lineOf('turn.busy'),
  /** Scene 19's offer; Scene 20's line on the reader's last room, by its stake. */
  endChoice: choices('end.longer'),
  dialSaid: {
    zero: firstOf('dial.said', 'groups', 'zero'),
    slow: firstOf('dial.said', 'groups', 'slow'),
    fast: firstOf('dial.said', 'groups', 'fast'),
    all: firstOf('dial.said', 'groups', 'all'),
    same: firstOf('dial.said', 'groups', 'same'),
  },
  /** Scene 21: after the game, won or lost. */
  stopWon: firstOf('stop.how', 'reactions', 'game-won'),
  stillWon: firstOf('stop.still', 'reactions', 'game-won'),
  stopLost: firstOf('stop.how', 'reactions', 'game-lost'),
  /** Scene 23: the two rooms' counts. */
  matchResult: lineOf('match.result'),
  turnStart: lineOf('turn.start'),
  turnNow: lineOf('turn.now'),
  effReadout: readoutOf(),
  effEnd: lineOf('eff.end'),
  /** Scenes 15–17: the one-link choices, keyed by the step that offers them. */
  links: Object.fromEntries(
    PAIR_STEPS.flatMap((step, i) => {
      const own = STORY.steps[i].choices;
      return own.length === 1 && !own[0].target ? [[step.id, own[0].key]] : [];
    }),
  ) as Record<string, string>,
  /** Scene 26: the whole old machine, as a side trip. */
  workshop: choices('sandbox.2')[0],
  giniToy: choices('gini.toy'),
  /** Scene 14: Red's answer to the paper — after one run, or after several. */
  whyAfter: firstOf('why.after', 'groups', 'one'),
  whyAgain: firstOf('why.after', 'groups', 'several'),
  /** Who answers each bet, and with what. */
  betLines: {
    coffee: firstOf('guess.react', 'groups', 'coffee'),
    lunch: firstOf('guess.react', 'groups', 'lunch'),
    vacation: firstOf('guess.react', 'groups', 'vacation'),
    percent: firstOf('guess.react', 'groups', 'percent'),
  },
} as const;

/** The step of the Scene 3 hold, by who is calling: both call in the same step. */
export const CALLS = { red: 'meet', blue: 'meet' } as const;

/** The news line the teletype types, and the reel's words, as the script has them. */
export const HEADLINE: string = storyOf('title.type').key!;
/** The outcome map's own name, for a screen reader: Red's line that shows it. */
export const MAP_LABEL: string = storyOf('map.all').key!;

/** The concept cards, as the script writes them: title, lines, formulas, pictures, a toy. */
export const CARDS = STORY.cards;

/** Where the panel a step belongs to begins. */
export function panelStart(index: number): number {
  for (let i = Math.min(index, PAIR_STEPS.length - 1); i > 0; i--) if (PAIR_STEPS[i].panel) return i;
  return 0;
}

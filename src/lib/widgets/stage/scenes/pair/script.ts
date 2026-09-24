/**
 * The pair stage, Scenes 1–14 of the dialogue brief, as data.
 *
 * Every step says three things: how it lets go (its wait), what is said (a
 * message key, never words — A2), and the POSE it leaves the stage in. A pose is
 * everything the reader can see that the argument depends on: the title, the
 * crowd, who has been named, how many coins each of them holds, what is on the
 * table, where they stand. `settle` draws a pose; `play` animates from one pose
 * to the next. Because poses are data, "every number in the dialogue equals the
 * number on screen" is a unit test, not a hope.
 *
 * Blue is the brief's trader A and Red is trader B, playing exactly the rounds
 * in `game.ts`.
 */
import { HOLDINGS, ROUNDS } from './game';
import { BIG, BITES_SECONDS, SMALL } from './crowd';
import { HOLD, READER, auto, type LineSpec, type StepSpec, type Wait } from '../../steps';

export type CrowdState = 'idle' | 'paid' | 'bitten' | 'two';
export type Place = 'marks' | 'seats' | 'room';
export type Flip = 'hidden' | 'shown' | 'blue' | 'red';

export interface Coins {
  readonly blue: number;
  readonly red: number;
}

export interface Pose {
  /** The news line and its source are typed out. */
  readonly teletype: boolean;
  /** Each title word has arrived (MERIT, or, MATH, and the "?" with the credit). */
  readonly merit: boolean;
  readonly or: boolean;
  readonly math: boolean;
  readonly mark: boolean;
  /** Scene 8: the title and every other word have left; only the two remain. */
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
  readonly place: Place;
  /** How many people are in the room (Scene 14). */
  readonly room: number;
  /** Scene 14's "Tell me · Not now". */
  readonly choice: boolean;
}

/** What a step does on the way in, for the scene's choreography. */
export type Action =
  | 'type'
  | 'reel-merit'
  | 'or'
  | 'reel-math'
  | 'payout'
  | 'bites'
  | 'gather'
  | 'lattice'
  | 'clear'
  | 'ante'
  | 'toss'
  | 'room';

export interface PairStep extends StepSpec {
  readonly pose: Pose;
  readonly action?: Action;
}

const START: Pose = {
  teletype: false,
  merit: false,
  or: false,
  math: false,
  mark: false,
  cleared: false,
  crowd: 'idle',
  named: { blue: false, red: false },
  coins: false,
  holdings: { blue: 15, red: 1 },
  table: { blue: 0, red: 0 },
  flip: 'hidden',
  place: 'marks',
  room: 2,
  choice: false,
};

interface Draft {
  id: string;
  wait?: Wait;
  who?: LineSpec['who'];
  say?: string;
  action?: Action;
  pose?: Partial<Pose>;
}

const blue = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'blue', say, ...rest });
const red = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'red', say, ...rest });

/** Holdings before and after each round, as Blue (A) and Red (B). */
const held = (i: number): Coins => ({ blue: HOLDINGS[i].a, red: HOLDINGS[i].b });
const staked = (round: number): Coins => ({ blue: ROUNDS[round].stake, red: ROUNDS[round].stake });
const minus = (a: Coins, b: Coins): Coins => ({ blue: a.blue - b.blue, red: a.red - b.red });
const NOTHING: Coins = { blue: 0, red: 0 };

/** Seconds a bubble is on screen when the stage moves on by itself (before Scene 5 teaches the controls). */
const READ = (ms: number) => auto(ms);

const DRAFTS: Draft[] = [
  // ---- Scene 1: teletype and title --------------------------------------
  { id: 'title.type', wait: auto(4600), action: 'type', pose: { teletype: true } },
  { id: 'title.merit', wait: auto(3800), action: 'reel-merit', pose: { merit: true } },
  { id: 'title.or', wait: auto(1000), action: 'or', pose: { or: true } },
  { id: 'title.math', wait: auto(3800), action: 'reel-math', pose: { math: true } },

  // ---- Scene 2: the crowd ----------------------------------------------
  { id: 'crowd.payout', wait: auto(2600), action: 'payout', pose: { crowd: 'paid', mark: true } },
  { id: 'crowd.bites', wait: auto(Math.round(BITES_SECONDS * 1000) + 300), action: 'bites', pose: { crowd: 'bitten' } },
  { id: 'crowd.two', wait: auto(1500), action: 'gather', pose: { crowd: 'two' } },

  // ---- Scene 3: calling out (hold: both clicked) -----------------------
  { id: 'call', wait: HOLD, pose: { named: { blue: true, red: true } } },

  // ---- Scene 4: introductions (the controls are not taught yet) ---------
  blue('intro.blue', 'intro_blue', { wait: READ(2900) }),
  red('intro.red', 'intro_red', { wait: READ(2900) }),
  red('intro.world', 'intro_world', { wait: READ(2900) }),
  blue('intro.small', 'intro_small', { wait: READ(2400) }),

  // ---- Scene 5: controls --------------------------------------------------
  red('ctl.1', 'ctl_1', { wait: READ(2600) }),
  blue('ctl.2', 'ctl_2', { wait: READ(2000) }),
  red('ctl.3', 'ctl_3', { wait: READ(2400) }),
  blue('ctl.4', 'ctl_4'),
  blue('ctl.5', 'ctl_5', { wait: READ(1900) }),

  // ---- Scene 6: the merit debate ---------------------------------------
  blue('merit.1b', 'merit_1b'),
  red('merit.1r', 'merit_1r'),
  blue('merit.2b', 'merit_2b'),
  red('merit.2r', 'merit_2r'),
  blue('merit.3b', 'merit_3b'),
  red('merit.3r', 'merit_3r'),
  blue('merit.4b', 'merit_4b'),
  red('merit.4r', 'merit_4r'),
  blue('merit.5b', 'merit_5b'),
  red('merit.5r', 'merit_5r'),
  blue('merit.6b', 'merit_6b'),
  red('merit.6r', 'merit_6r'),

  // ---- Scene 7: the invitation — numbers appear ------------------------
  red('invite.1', 'invite_1', { action: 'lattice', pose: { coins: true } }),
  blue('invite.2', 'invite_2'),
  red('invite.3', 'invite_3'),
  blue('invite.4', 'invite_4'),
  red('invite.5', 'invite_5'),
  blue('invite.6', 'invite_6'),

  // ---- Scene 8: clearing the stage -------------------------------------
  { id: 'clear', wait: auto(1500), action: 'clear', pose: { cleared: true, place: 'seats' } },

  // ---- Scene 9: the reader makes them equal (hold: 8 and 8) ------------
  blue('equal', 'equal_ask', { wait: HOLD, pose: { holdings: held(0) } }),
  red('equal.done', 'equal_done'),

  // ---- Scene 10: round one, with the minimum rule ----------------------
  red('r1.rules', 'r1_rules'),
  blue('r1.half', 'r1_half', { action: 'ante', pose: { holdings: minus(held(0), staked(0)), table: staked(0) } }),
  red('r1.flip', 'r1_flip', { pose: { flip: 'shown' } }),
  red('r1.winner', 'r1_winner'),
  blue('r1.odds', 'r1_odds'),
  { id: 'r1.toss', wait: auto(2600), action: 'toss', pose: { holdings: held(1), table: NOTHING, flip: 'red' } },
  blue('r1.hm', 'r1_hm'),

  // ---- Scene 11: round two — the rule breaks and gets fixed ------------
  red('r2.again', 'r2_again', { pose: { flip: 'hidden' } }),
  blue('r2.wait', 'r2_wait'),
  red('r2.half', 'r2_half'),
  blue('r2.two', 'r2_two'),
  red('r2.rule', 'r2_rule', { action: 'ante', pose: { holdings: minus(held(1), staked(1)), table: staked(1) } }),
  red('r2.why', 'r2_why'),
  blue('r2.go', 'r2_go', { pose: { flip: 'shown' } }),
  { id: 'r2.toss', wait: auto(2600), action: 'toss', pose: { holdings: held(2), table: NOTHING, flip: 'blue' } },
  blue('r2.told', 'r2_told'),

  // ---- Scene 12: one more round, faster --------------------------------
  {
    id: 'r3.ante',
    wait: auto(1300),
    action: 'ante',
    pose: { holdings: minus(held(2), staked(2)), table: staked(2), flip: 'shown' },
  },
  { id: 'r3.toss', wait: auto(2400), action: 'toss', pose: { holdings: held(3), table: NOTHING, flip: 'blue' } },
  blue('r3.done', 'r3_done'),

  // ---- Scene 13: the challenge -----------------------------------------
  blue('dare.ahead', 'dare_ahead', { pose: { flip: 'hidden' } }),
  blue('dare.pointless', 'dare_pointless'),
  red('dare.why', 'dare_why'),
  blue('dare.edge', 'dare_edge'),
  red('dare.what', 'dare_what'),
  blue('dare.no', 'dare_no'),
  red('dare.imagine', 'dare_imagine'),
  blue('dare.luck', 'dare_luck'),
  red('dare.math', 'dare_math'),
  blue('dare.nice', 'dare_nice'),
  red('dare.prove', 'dare_prove'),
  blue('dare.bet', 'dare_bet'),
  red('dare.all', 'dare_all'),
  blue('dare.sure', 'dare_sure'),
  red('dare.very', 'dare_very'),

  // ---- Scene 14: more players, and the pair joins the room -------------
  red('more.add', 'more_add'),
  blue('more.how', 'more_how'),
  red('more.hundred', 'more_hundred', { action: 'room', pose: { place: 'room', room: 100 } }),
  red('more.random', 'more_random'),
  blue('more.watch', 'more_watch'),
  blue('more.real', 'more_real'),
  red('more.joke', 'more_joke', { pose: { choice: true } }),
];

function build(): PairStep[] {
  let pose = START;
  return DRAFTS.map((draft) => {
    pose = { ...pose, ...draft.pose };
    const step: PairStep = {
      id: draft.id,
      wait: draft.wait ?? READER,
      pose,
      ...(draft.say ? { lines: [{ who: draft.who ?? null, message: draft.say }] } : {}),
      ...(draft.action ? { action: draft.action } : {}),
    };
    return step;
  });
}

export const PAIR_STEPS: readonly PairStep[] = build();

export const indexOf = (id: string): number => PAIR_STEPS.findIndex((step) => step.id === id);

/** The crowd index each protagonist grew out of. */
export const CROWD_INDEX = { blue: BIG, red: SMALL } as const;

/** Live values a line needs, taken from the pose on screen — never typed in. */
export function valuesFor(step: PairStep): Record<string, number> {
  return { blue: step.pose.holdings.blue, red: step.pose.holdings.red };
}

/**
 * Lines the scene speaks on EVENTS inside a hold rather than as steps: the
 * call-outs while the reader has not clicked (Scene 3) and the reactions while
 * coins move (Scene 9). Listed here so a test can prove every scripted line is
 * spoken somewhere.
 */
export const REACTIONS = {
  callPool: ['call_pool_1', 'call_pool_2', 'call_pool_3', 'call_pool_4', 'call_pool_5'],
  callBig: 'call_big',
  callSmall: 'call_small',
  callAfter: ['call_after_1', 'call_after_2'],
  equalFirst: 'equal_first',
  equalEleven: 'equal_eleven',
  equalOverBlue: 'equal_over_b',
  equalOverRed: 'equal_over_r',
} as const;

/**
 * The pair stage, Scenes 1–11 of the iteration-2 brief, as data.
 *
 * Every step says three things: how it lets go (its wait), what is said (a
 * message key, never words — A2), and the POSE it leaves the stage in. Key
 * lines wait for the reader; chit-chat (`CHAT`) moves on by itself once read.
 * The talk reads like a chat window: lines stay while they are still context
 * ("I'm the richest man in this world" while he says he worked hard for it),
 * a `brief` line goes as soon as anyone says the next thing ("Psst. Over
 * here."), and a `panel` starts a new conversation (the room). A step can
 * `log` what just happened — a toss — as a line of its own. A pose is
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
import { BIG, RAIN_SECONDS, SMALL } from './crowd';
import { CHAT, HOLD, READER, auto, type LineSpec, type StepSpec, type Wait } from '../../steps';

/** Scene 2: not here yet · bounced in · coins caught · only the two left. */
export type CrowdState = 'away' | 'idle' | 'paid' | 'two';
export type Place = 'marks' | 'seats' | 'room';
export type Flip = 'hidden' | 'shown' | 'blue' | 'red';

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
}

/** What a step does on the way in, for the scene's choreography. */
export type Action =
  | 'type'
  | 'merit'
  | 'or'
  | 'reel-math'
  | 'payout'
  | 'gather'
  | 'lattice'
  | 'clear'
  | 'ante'
  | 'toss'
  | 'room'
  | 'run';

export interface PairStep extends StepSpec {
  readonly pose: Pose;
  readonly action?: Action;
  /** Clears the talk: a new setting, a new conversation. */
  readonly panel?: true;
  /** Its line goes as soon as the next one is said. */
  readonly brief?: true;
  /** A message logged in the talk once the step's action is over (the toss result). */
  readonly log?: string;
}

const START: Pose = {
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
  place: 'marks',
  room: 2,
  choice: false,
  cards: [],
  cardOpen: null,
  ran: false,
};

interface Draft {
  id: string;
  wait?: Wait;
  who?: LineSpec['who'];
  say?: string;
  action?: Action;
  pose?: Partial<Pose>;
  panel?: true;
  brief?: true;
  log?: string;
}

const blue = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'blue', say, ...rest });
const red = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'red', say, ...rest });

/** Holdings before and after each round, as Blue (A) and Red (B). */
const held = (i: number): Coins => ({ blue: HOLDINGS[i].a, red: HOLDINGS[i].b });
const staked = (round: number): Coins => ({ blue: ROUNDS[round].stake, red: ROUNDS[round].stake });
const minus = (a: Coins, b: Coins): Coins => ({ blue: a.blue - b.blue, red: a.red - b.red });
const NOTHING: Coins = { blue: 0, red: 0 };

/** How long the run takes on screen, ms: slow enough to see it happen (brief Scene 13). */
export const RUN_MS = 16_000;

const DRAFTS: Draft[] = [
  // ---- Scene 1: teletype and title, in reading order ----------------------
  { id: 'title.type', wait: auto(4600), action: 'type', pose: { teletype: true, crowd: 'idle' } },
  { id: 'title.merit', wait: auto(1500), action: 'merit', pose: { merit: true } },
  { id: 'title.or', wait: auto(900), action: 'or', pose: { or: true } },
  { id: 'title.math', wait: auto(3800), action: 'reel-math', pose: { math: true } },

  // ---- Scene 2: the crowd ----------------------------------------------
  { id: 'crowd.payout', wait: auto(Math.round(RAIN_SECONDS * 1000) + 500), action: 'payout', pose: { crowd: 'paid', mark: true } },
  { id: 'crowd.two', wait: auto(2600), action: 'gather', pose: { crowd: 'two' } },

  // ---- Scene 3: meeting them — Red calls, then Blue (holds: a click each) --
  red('call.red', 'meet_red_call_1', { wait: HOLD, panel: true, brief: true, pose: { compact: true, named: { blue: false, red: true } } }),
  red('meet.red', 'meet_red', { wait: CHAT }),
  blue('call.blue', 'meet_blue_call_1', { wait: HOLD, brief: true, pose: { named: { blue: true, red: true } } }),
  blue('meet.blue', 'meet_blue', { wait: CHAT }),
  red('meet.tip', 'meet_tip', { brief: true }),

  // ---- Scene 4: the merit debate — every line waits ------------------------
  blue('merit.1b', 'merit_1b'),
  red('merit.1r', 'merit_1r'),
  blue('merit.2b', 'merit_2b'),
  red('merit.2r', 'merit_2r'),
  blue('merit.3b', 'merit_3b'),
  red('merit.3r', 'merit_3r'),

  // ---- Scene 5: the invitation — numbers appear, then the reader evens them --
  red('invite.1', 'invite_1', { action: 'lattice', pose: { coins: true } }),
  blue('invite.2', 'invite_2', { wait: CHAT }),
  red('invite.3', 'invite_3'),
  blue('invite.4', 'invite_4', { wait: CHAT }),
  red('invite.5', 'invite_5'),
  blue('invite.6', 'invite_6', { wait: CHAT }),
  { id: 'clear', wait: auto(1500), action: 'clear', pose: { cleared: true, place: 'seats' } },
  blue('equal', 'equal_ask', { wait: HOLD, pose: { holdings: held(0) } }),
  red('equal.done', 'equal_done', { wait: CHAT }),

  // ---- Scene 6: round one, with the incomplete rule -------------------------
  red('r1.rules', 'r1_rules'),
  blue('r1.half', 'r1_half', { action: 'ante', pose: { holdings: minus(held(0), staked(0)), table: staked(0) } }),
  red('r1.flip', 'r1_flip', { pose: { flip: 'shown' } }),
  red('r1.winner', 'r1_winner'),
  { id: 'r1.toss', wait: auto(3600), action: 'toss', log: 'log_toss', pose: { holdings: held(1), table: NOTHING, flip: 'red' } },
  blue('r1.ouch', 'r1_ouch', { wait: CHAT }),

  // ---- Scene 7: round two — the rule breaks, and Blue says the fix ---------
  blue('r2.wait', 'r2_wait', { pose: { flip: 'hidden' } }),
  red('r2.half', 'r2_half'),
  blue('r2.two', 'r2_two', { wait: CHAT }),
  red('r2.match', 'r2_match', { action: 'ante', pose: { holdings: minus(held(1), staked(1)), table: staked(1) } }),
  blue('r2.rule', 'r2_rule'),
  red('r2.why', 'r2_why'),
  blue('r2.go', 'r2_go', { wait: CHAT, pose: { flip: 'shown' } }),
  { id: 'r2.toss', wait: auto(3600), action: 'toss', log: 'log_toss', pose: { holdings: held(2), table: NOTHING, flip: 'blue' } },

  // ---- Scene 8: round three, slower, said out loud ---------------------------
  red('r3.each', 'r3_each', {
    wait: CHAT,
    action: 'ante',
    pose: { holdings: minus(held(2), staked(2)), table: staked(2), flip: 'shown' },
  }),
  blue('r3.flip', 'r3_flip', { wait: CHAT, brief: true }),
  { id: 'r3.toss', wait: auto(3600), action: 'toss', log: 'log_toss', pose: { holdings: held(3), table: NOTHING, flip: 'blue' } },
  blue('r3.done', 'r3_done', { wait: CHAT }),

  // ---- Scene 9: the challenge ------------------------------------------
  blue('dare.ahead', 'dare_ahead', { wait: CHAT, pose: { flip: 'hidden' } }),
  blue('dare.pointless', 'dare_pointless', { wait: CHAT }),
  red('dare.why', 'dare_why', { wait: CHAT }),
  blue('dare.edge', 'dare_edge'),
  red('dare.what', 'dare_what'),
  blue('dare.no', 'dare_no', { wait: CHAT }),
  red('dare.imagine', 'dare_imagine'),
  blue('dare.luck', 'dare_luck'),
  red('dare.math', 'dare_math'),
  blue('dare.nice', 'dare_nice', { wait: CHAT }),
  red('dare.prove', 'dare_prove'),
  blue('dare.bet', 'dare_bet'),
  red('dare.all', 'dare_all'),
  blue('dare.sure', 'dare_sure', { wait: CHAT }),
  red('dare.laugh', 'dare_laugh', { wait: CHAT }),
  red('dare.more', 'dare_more'),

  // ---- Scene 10: the crowd arrives; the pair joins the room ------------------
  red('more.shapes', 'more_shapes', { panel: true, action: 'room', pose: { place: 'room', room: 100 } }),
  red('more.random', 'more_random'),
  red('more.rule', 'more_rule', { pose: { cards: ['rule'] } }),
  blue('more.watch', 'more_watch', { wait: CHAT }),

  // ---- Scene 11: the joke offer ----------------------------------------
  blue('more.real', 'more_real'),
  red('more.joke', 'more_joke', { pose: { choice: true } }),

  // ---- Scene 12: your guess, inside the stage (holds: a guess, then a bet) --
  red('guess.ask', 'guess_ask', { panel: true, pose: { choice: false } }),
  red('guess.rule', 'guess_rule', { pose: { cardOpen: 'rule' } }),
  red('guess.what', 'guess_what', { wait: HOLD, log: 'log_guess' }),
  red('guess.stake', 'guess_stake', { wait: HOLD, log: 'log_bet', pose: { cardOpen: null } }),
  { id: 'guess.react', wait: CHAT },

  // ---- Scene 13: the run, in the same room ---------------------------------
  red('run.go', 'run_go', { panel: true }),
  { id: 'run', wait: auto(RUN_MS + 4000), action: 'run', log: 'log_run', pose: { ran: true } },
  { id: 'run.banter', wait: CHAT },
  red('run.again', 'run_again'),

  // ---- Scene 14: so why did they win? -------------------------------------
  blue('why.paper', 'why_paper'),
  { id: 'why.after', wait: READER },
  red('why.once', 'why_once'),
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
      ...(draft.panel ? { panel: true as const } : {}),
      ...(draft.brief ? { brief: true as const } : {}),
      ...(draft.log ? { log: draft.log } : {}),
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
 * caller trying again while the reader has not clicked (Scene 3) and the
 * reactions while coins move (Scene 5). Listed here so a test can prove every
 * scripted line is spoken somewhere.
 */
export const REACTIONS = {
  callRed: ['meet_red_call_1', 'meet_red_call_2', 'meet_red_call_3', 'meet_red_call_4'],
  callBlue: ['meet_blue_call_1', 'meet_blue_call_2', 'meet_blue_call_3'],
  equalFirst: 'equal_first',
  equalEleven: 'equal_eleven',
  equalOverBlue: 'equal_over_b',
  equalOverRed: 'equal_over_r',
  /** Scene 12: the four outcomes, in the order of PREDICTIONS; the four bets, in the order of BETS. */
  guesses: ['guess_choice_1', 'guess_choice_2', 'guess_choice_3', 'guess_choice_4'],
  bets: ['guess_bet_1', 'guess_bet_2', 'guess_bet_3', 'guess_bet_4'],
  /** Scene 13: the banter after a run, by who finished richest. */
  runBanter: {
    other: [
      { who: 'blue', message: 'run_where' },
      { who: 'red', message: 'run_here' },
      { who: 'blue', message: 'run_have' },
      { who: 'red', message: 'run_havetoo' },
      { who: 'red', message: 'run_told' },
    ],
    blue: [
      { who: 'blue', message: 'run_blue_b' },
      { who: 'red', message: 'run_blue_r' },
    ],
    red: [
      { who: 'red', message: 'run_red_r' },
      { who: 'blue', message: 'run_red_b' },
    ],
  },
  runChoices: ['run_choice_1', 'run_choice_2'],
  /** Scene 14: Red's answer to the paper — after one run, or after several. */
  whyAfter: { who: 'red', message: 'why_after' },
  whyAgain: { who: 'red', message: 'why_again' },
  /** Who answers each bet, and with what. */
  betLines: {
    coffee: { who: 'blue', message: 'guess_coffee' },
    lunch: { who: 'red', message: 'guess_lunch' },
    vacation: { who: 'blue', message: 'guess_vacation' },
    percent: { who: 'red', message: 'guess_percent' },
  },
} as const;

/** The step of each Scene 3 hold, by who is calling. */
export const CALLS = { red: 'call.red', blue: 'call.blue' } as const;

/** Where the panel a step belongs to begins. */
export function panelStart(index: number): number {
  for (let i = Math.min(index, PAIR_STEPS.length - 1); i > 0; i--) if (PAIR_STEPS[i].panel) return i;
  return 0;
}

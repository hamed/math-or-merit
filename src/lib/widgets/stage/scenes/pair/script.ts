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
import { BIG, DROPS, SMALL } from './crowd';
import { DROP_GAP, FALL } from './rain';
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
  /** How the room stands (Scenes 15–17). */
  readonly roomMode: RoomMode;
  /** How much of the Lorenz picture is drawn: 0 none · 1 the curve · 2 and the diagonal · 3 and the gap. */
  readonly lorenz: 0 | 1 | 2 | 3;
  /** Small pictures of concepts already built, in the side rail (brief 5.3). */
  readonly thumbs: readonly string[];
  /**
   * Whose fortunes the room shows: the run of Scene 13 (played on in Scene
   * 19) · the dial's fresh room (20) · the tax game, live (21–22) · the
   * matched pair, trades only on the left (23).
   */
  readonly source: RoomSource;
  /** A control the reader holds in this step: the stake dial, the tax game. */
  readonly control: 'stake' | 'tax' | null;
  /** Scene 22's lesson: 0 before · 1 a quarter of every pile in the pool · 2 the pool shared back. */
  readonly levy: 0 | 1 | 2;
  /** Scene 24: 0 no map · 1 every square filled in · 2 and the fitted curve. */
  readonly map: 0 | 1 | 2;
}

export type RoomSource = 'run' | 'dial' | 'game' | 'pair';

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
  | 'double'
  | 'half'
  | 'one'
  | 'four'
  | 'turnover'
  | 'levy4'
  | 'matched'
  | 'map';

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
  | 'run'
  | 'arrange'
  | 'walk'
  | 'dial'
  | 'game'
  | 'coins'
  | 'match'
  | 'map';

export interface PairStep extends StepSpec {
  readonly pose: Pose;
  readonly action?: Action;
  /** Clears the talk: a new setting, a new conversation. */
  readonly panel?: true;
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
  roomMode: 'free',
  lorenz: 0,
  thumbs: [],
  source: 'run',
  control: null,
  levy: 0,
  map: 0,
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
  aside?: true;
  log?: string;
}

const blue = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'blue', say, ...rest });
const red = (id: string, say: string, rest: Omit<Draft, 'id' | 'who' | 'say'> = {}): Draft => ({ id, who: 'red', say, ...rest });

/** Holdings before and after each round, as Blue (A) and Red (B). */
const held = (i: number): Coins => ({ blue: HOLDINGS[i].a, red: HOLDINGS[i].b });
const staked = (round: number): Coins => ({ blue: ROUNDS[round].stake, red: ROUNDS[round].stake });
const minus = (a: Coins, b: Coins): Coins => ({ blue: a.blue - b.blue, red: a.red - b.red });
const NOTHING: Coins = { blue: 0, red: 0 };

/** The concept cards of Scenes 13–18, in the order they were made. */
const CARDS = ['rule', 'histogram', 'gini', 'participants', 'turnover'];

/**
 * Scene 22's four, in the room's cast order (Blue, Red, then two others): coins
 * before the levy. The average is eight.
 */
export const LEVY_COINS: readonly number[] = [16, 4, 8, 4];
export const LEVY_RATE = 0.25;

/** The four's coins and the pool at each moment of the lesson: before · collected · shared back. */
export function levyLesson(stage: 0 | 1 | 2): { coins: number[]; pool: number } {
  const taken = LEVY_COINS.map((c) => c * LEVY_RATE);
  const pool = taken.reduce((sum, c) => sum + c, 0);
  if (stage === 0) return { coins: [...LEVY_COINS], pool: 0 };
  if (stage === 1) return { coins: LEVY_COINS.map((c, k) => c - taken[k]), pool };
  return { coins: LEVY_COINS.map((c, k) => c - taken[k] + pool / LEVY_COINS.length), pool: 0 };
}

/** How long the rain step lasts: every drop, the last fall, and a moment to stand still. */
export const RAIN_WAIT_MS = Math.round((0.4 + DROPS.length * DROP_GAP + FALL + 2.4) * 1000);

/** How long the run takes on screen, ms: slow enough to see it happen (brief Scene 13). */
export const RUN_MS = 16_000;

const DRAFTS: Draft[] = [
  // ---- Scene 1: teletype and title, in reading order ----------------------
  { id: 'title.type', wait: auto(4600), action: 'type', pose: { teletype: true, crowd: 'idle' } },
  { id: 'title.merit', wait: auto(1500), action: 'merit', pose: { merit: true } },
  { id: 'title.or', wait: auto(900), action: 'or', pose: { or: true } },
  { id: 'title.math', wait: auto(3800), action: 'reel-math', pose: { math: true } },

  // ---- Scene 2: the crowd ----------------------------------------------
  { id: 'crowd.payout', wait: auto(RAIN_WAIT_MS), action: 'payout', pose: { crowd: 'paid', mark: true } },
  { id: 'crowd.two', wait: auto(2600), action: 'gather', pose: { crowd: 'two' } },

  // ---- Scene 3: meeting them — Red calls, then Blue (holds: a click each) --
  red('call.red', 'meet_red_call_1', { wait: HOLD, panel: true, brief: true, aside: true, pose: { compact: true, named: { blue: false, red: true } } }),
  red('meet.red', 'meet_red', { wait: CHAT, aside: true }),
  blue('call.blue', 'meet_blue_call_1', { wait: HOLD, brief: true, aside: true, pose: { named: { blue: true, red: true } } }),
  blue('meet.blue', 'meet_blue', { wait: CHAT, aside: true }),
  red('meet.tip', 'meet_tip', { brief: true, aside: true }),

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
  blue('equal', 'equal_ask', { wait: HOLD, aside: true, pose: { holdings: held(0) } }),
  red('equal.done', 'equal_done', { wait: CHAT }),

  // ---- Scene 6: round one, with the incomplete rule -------------------------
  red('r1.rules', 'r1_rules'),
  blue('r1.half', 'r1_half', { action: 'ante', pose: { holdings: minus(held(0), staked(0)), table: staked(0) } }),
  red('r1.flip', 'r1_flip', { pose: { flip: 'shown' } }),
  red('r1.winner', 'r1_winner'),
  { id: 'r1.toss', wait: auto(3600), action: 'toss', log: 'log_toss', pose: { holdings: held(1), table: NOTHING, flip: 'red' } },
  blue('r1.ouch', 'r1_ouch', { wait: CHAT, aside: true }),

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
  blue('r3.done', 'r3_done', { wait: CHAT, aside: true }),

  // ---- Scene 9: the challenge ------------------------------------------
  blue('dare.ahead', 'dare_ahead', { wait: CHAT, aside: true, pose: { flip: 'hidden' } }),
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
  red('more.joke', 'more_joke', { aside: true, pose: { choice: true } }),

  // ---- Scene 12: your guess, inside the stage (holds: a guess, then a bet) --
  red('guess.ask', 'guess_ask', { panel: true, aside: true, pose: { choice: false } }),
  red('guess.rule', 'guess_rule', { aside: true, pose: { cardOpen: 'rule' } }),
  red('guess.what', 'guess_what', { wait: HOLD, aside: true, log: 'log_guess' }),
  red('guess.stake', 'guess_stake', { wait: HOLD, aside: true, log: 'log_bet', pose: { cardOpen: null } }),
  { id: 'guess.react', wait: CHAT, aside: true },

  // ---- Scene 13: the run, in the same room ---------------------------------
  red('run.go', 'run_go', { panel: true, aside: true }),
  { id: 'run', wait: CHAT, action: 'run', log: 'log_run', pose: { ran: true } },
  { id: 'run.banter', wait: CHAT },
  red('run.again', 'run_again', { aside: true }),

  // ---- Scene 14: so why did they win? -------------------------------------
  blue('why.paper', 'why_paper'),
  { id: 'why.after', wait: READER },
  red('why.once', 'why_once', { aside: true }),

  // ---- Scene 15: line them up — the histogram, in the room -----------------
  red('sort.ask', 'sort_ask', { panel: true, aside: true }),
  { id: 'sort.piles', wait: auto(4800), action: 'arrange', pose: { roomMode: 'piles' } },
  blue('sort.real', 'sort_real'),
  red('sort.edge', 'sort_edge'),
  blue('sort.where', 'sort_where', { wait: CHAT }),
  { id: 'sort.there', wait: CHAT },
  blue('sort.squeeze', 'sort_squeeze'),
  red('sort.ruler', 'sort_ruler'),
  { id: 'sort.log', wait: auto(3400), action: 'arrange', pose: { roomMode: 'ruler' } },
  red('sort.times', 'sort_times'),
  blue('sort.even', 'sort_even', { wait: CHAT }),
  red('sort.dust', 'sort_dust'),
  red('sort.back', 'sort_back', { aside: true }),
  {
    id: 'sort.home',
    wait: auto(2000),
    action: 'arrange',
    pose: { roomMode: 'free', thumbs: ['histogram'], cards: ['rule', 'histogram'] },
  },

  // ---- Scene 16: measure the room — the Gini, built from the line ----------
  blue('gini.ask', 'gini_ask', { panel: true }),
  red('gini.line', 'gini_line', { action: 'arrange', pose: { roomMode: 'line' } }),
  red('gini.add', 'gini_add', { action: 'walk', pose: { lorenz: 1 } }),
  red('gini.equal', 'gini_equal', { pose: { lorenz: 2 } }),
  red('gini.gap', 'gini_gap', { pose: { lorenz: 3 } }),
  { id: 'gini.value', wait: READER },
  red('gini.toy', 'gini_toy', { aside: true }),
  {
    id: 'gini.home',
    wait: auto(2000),
    action: 'arrange',
    pose: { roomMode: 'free', lorenz: 0, thumbs: ['histogram', 'gini'], cards: ['rule', 'histogram', 'gini'] },
  },

  // ---- Scene 17: how many still count? — the room tries the cases -----------
  blue('eff.ask', 'eff_ask', { panel: true }),
  red('eff.equal', 'eff_equal', { action: 'arrange', pose: { roomMode: 'equal' } }),
  { id: 'eff.brutal', wait: READER, action: 'arrange', pose: { roomMode: 'zero' } },
  { id: 'eff.give', wait: READER, action: 'arrange', pose: { roomMode: 'double' } },
  { id: 'eff.half', wait: READER, action: 'arrange', pose: { roomMode: 'half' } },
  { id: 'eff.one', wait: READER, action: 'arrange', pose: { roomMode: 'one' } },
  { id: 'eff.room', wait: READER, action: 'arrange', pose: { roomMode: 'free' } },
  red('eff.try', 'eff_try', { aside: true, action: 'arrange', pose: { roomMode: 'four' } }),
  {
    id: 'eff.end',
    wait: READER,
    action: 'arrange',
    pose: {
      roomMode: 'free',
      thumbs: ['histogram', 'gini', 'participants'],
      cards: ['rule', 'histogram', 'gini', 'participants'],
    },
  },

  // ---- Scene 18: is anything moving? — turnover -----------------------------
  { id: 'turn.busy', wait: READER, panel: true },
  red('turn.count', 'turn_count', { action: 'arrange', pose: { roomMode: 'turnover' } }),
  { id: 'turn.start', wait: READER },
  { id: 'turn.now', wait: READER },
  blue('turn.dead', 'turn_dead'),
  {
    id: 'turn.home',
    wait: auto(1800),
    action: 'arrange',
    pose: {
      roomMode: 'free',
      thumbs: ['histogram', 'gini', 'participants', 'turnover'],
      cards: ['rule', 'histogram', 'gini', 'participants', 'turnover'],
    },
  },

  // ---- Scene 19: where it ends — the theorem, and "run it longer" ------------
  red('end.one', 'end_one', { panel: true, aside: true }),
  red('end.proof', 'end_proof'),
  blue('end.when', 'end_when', { wait: CHAT }),
  red('end.limit', 'end_limit'),
  red('end.longer', 'end_longer', { aside: true, pose: { cards: [...CARDS, 'limit'] } }),

  // ---- Scene 20: your hand on the dial — the stake, from nothing to everything --
  red('dial.ask', 'dial_ask', { panel: true, aside: true, action: 'dial', pose: { source: 'dial', control: 'stake' } }),
  { id: 'dial.said', wait: CHAT },
  red('dial.law', 'dial_law', { pose: { control: null, cards: [...CARDS, 'limit', 'stake'] } }),

  // ---- Scene 21: now you try to stop it — the tax game, live ------------------
  red('stop.ask', 'stop_ask', { panel: true, aside: true, action: 'game', pose: { source: 'game', control: 'tax' } }),
  red('stop.how', 'stop_how'),
  red('stop.hand', 'stop_hand', { pose: { control: null } }),
  red('stop.rule', 'stop_rule'),

  // ---- Scene 22: put the levy in the rules — four piles, one pool --------------
  red('levy.ask', 'levy_ask', { panel: true, aside: true, action: 'arrange', pose: { roomMode: 'levy4' } }),
  red('levy.collect', 'levy_collect', { action: 'coins', pose: { levy: 1 } }),
  blue('levy.same', 'levy_same', { wait: CHAT }),
  red('levy.shares', 'levy_shares'),
  red('levy.return', 'levy_return', { action: 'coins', pose: { levy: 2 } }),
  red('levy.net', 'levy_net'),
  blue('levy.paid', 'levy_paid', { wait: CHAT, aside: true }),
  red('levy.kept', 'levy_kept', { pose: { cards: [...CARDS, 'limit', 'stake', 'levy'] } }),

  // ---- Scene 23: trade and return together — two rooms, the same luck --------
  red('match.ask', 'match_ask', { panel: true, action: 'match', pose: { roomMode: 'matched', source: 'pair', levy: 0 } }),
  { id: 'match.result', wait: READER },
  blue('match.luck', 'match_luck', { wait: CHAT }),
  red('match.same', 'match_same'),

  // ---- Scene 24: the outcome map -------------------------------------------
  blue('map.ask', 'map_ask', { panel: true, action: 'arrange', pose: { roomMode: 'free', source: 'run' } }),
  red('map.all', 'map_all', { action: 'map', pose: { roomMode: 'map', map: 1 } }),
  red('map.fit', 'map_fit', { pose: { map: 2 } }),
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
      ...(draft.aside ? { aside: true as const } : {}),
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
  /** Scenes 15–17: lines whose words carry what the room on screen shows. */
  sortThere: { who: 'red', message: 'sort_there' },
  giniValue: { who: 'red', message: 'gini_value' },
  effRoom: { who: 'red', message: 'eff_room' },
  effCases: {
    'eff.brutal': { who: 'red', message: 'eff_brutal' },
    'eff.give': { who: 'red', message: 'eff_give' },
    'eff.half': { who: 'red', message: 'eff_half' },
    'eff.one': { who: 'red', message: 'eff_one' },
    'eff.room': { who: 'red', message: 'eff_room' },
  },
  turnBusy: { who: 'blue', message: 'turn_busy' },
  /** Scene 19's offer; Scene 20's line on the reader's last room, by its stake. */
  endChoice: ['end_choice_1', 'end_choice_2'],
  dialSaid: {
    zero: { who: 'red', message: 'dial_zero' },
    slow: { who: 'red', message: 'dial_slow' },
    fast: { who: 'red', message: 'dial_fast' },
    all: { who: 'red', message: 'dial_all' },
    same: { who: 'red', message: 'dial_same' },
  },
  /** Scene 21: after the game, won or lost. */
  stopWon: { who: 'red', message: 'stop_won' },
  stopLost: { who: 'red', message: 'stop_lost' },
  /** Scene 23: the two rooms' counts. */
  matchResult: { who: 'red', message: 'match_result' },
  turnStart: { who: 'red', message: 'turn_start' },
  turnNow: { who: 'red', message: 'turn_now' },
  effReadout: { who: 'red', message: 'eff_readout' },
  effEnd: { who: 'blue', message: 'eff_end' },
  /** Scenes 15–17: the one-link choices, and the yes/no offers of a toy. */
  links: { 'sort.ask': 'sort_do', 'sort.ruler': 'sort_ruler_do', 'sort.back': 'sort_back_do', 'eff.try': 'eff_done' },
  stopStart: 'stop_start',
  giniToy: ['gini_toy_choice_1', 'gini_toy_choice_2'],
  effDone: 'eff_done',
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

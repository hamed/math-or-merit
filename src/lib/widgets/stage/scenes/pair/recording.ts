/**
 * A run of the room, recorded (Scene 13; owner review 2026-09-26: stop sooner,
 * rewind to any moment, count the money that changes hands).
 *
 * The whole run is played out at once with the model's own trade
 * (`applyYardSaleTrade`), round by round — a round is one trade per person on
 * average — and every round's end is kept: everyone's share, and how much of
 * the room's money changed hands in it (turnover, as the sandbox counts it).
 * The stage then plays the recording back in time; the time dial scrubs it;
 * the concept acts measure whatever moment is on screen. Same seed and
 * settings, same recording: a run can be rebuilt from a few numbers.
 *
 * Pure and headless.
 */
import { applyYardSaleTrade, createRandomSource } from '$lib/sim';
import { applyFlatWealthLevy, applyTargetedWealthLevy } from '$lib/research';

/** When a run stops. */
export type StopRule =
  /** after a fixed number of trades */
  | { readonly kind: 'trades'; readonly trades: number }
  /** once the richest holds this share of everything */
  | { readonly kind: 'share'; readonly share: number }
  /** once only this many people still hold at least `floor` of the room each */
  | { readonly kind: 'survivors'; readonly count: number; readonly floor: number };

export interface RunSettings {
  readonly n: number;
  readonly beta: number;
  readonly stop: StopRule;
  /** Never more than this many trades, whatever the rule. */
  readonly cap: number;
  /**
   * The shared rule (Scenes 22–23): at the end of every round, this share of
   * every fortune goes into one pool, and the pool comes back in equal parts.
   * Only trades count as turnover; the levy never pads it.
   */
  readonly levy?: number;
  /** The levy comes every this many rounds (the sandbox's cadence); every round when absent. */
  readonly levyEvery?: number;
}

export interface Recording {
  readonly seed: number;
  readonly settings: RunSettings;
  /** Everyone's share of the room at the end of each round; frame 0 is the start. */
  readonly frames: readonly Float64Array[];
  /** Trades done by each frame. */
  readonly trades: readonly number[];
  /** Share of all the room's money that changed hands during each round (frame k covers round k). */
  readonly turnover: readonly number[];
}

function stopped(stop: StopRule, wealth: Float64Array, trades: number): boolean {
  switch (stop.kind) {
    case 'trades':
      return trades >= stop.trades;
    case 'share': {
      let max = 0;
      for (let i = 0; i < wealth.length; i++) max = Math.max(max, wealth[i]);
      return max >= stop.share;
    }
    case 'survivors': {
      let count = 0;
      for (let i = 0; i < wealth.length; i++) if (wealth[i] >= stop.floor) count++;
      return count <= stop.count;
    }
  }
}

/**
 * A room played a few trades at a time and recorded as it goes: the tax game
 * (Scene 21) trades live with the reader's hand in it, and every run is played
 * out through one of these. A round ends after one trade per person on
 * average, or as soon as the stop rule is met; the shared levy, if any, comes
 * at the end of every round, and then the round is kept as a frame.
 */
export interface Recorder {
  /** Everyone's share right now (live: the reader's taps land here at once). */
  readonly wealth: Float64Array;
  readonly trades: number;
  /** The stop rule, or the cap, has been met. */
  readonly done: boolean;
  /** Play up to `count` more trades. */
  play(count: number): void;
  /** A tap: `rate` of one fortune goes into a pool, shared back equally. Returns what was taken. */
  take(index: number, rate: number): number;
  /** The reader turns a dial while the room trades (the sandbox): the next trade plays by it. */
  setRules(rules: { readonly beta?: number; readonly levy?: number; readonly levyEvery?: number }): void;
  /** Everything kept so far. */
  recording(): Recording;
}

export function recorder(settings: RunSettings, seed: number, start?: ArrayLike<number>): Recorder {
  const { n, stop, cap } = settings;
  let beta = settings.beta;
  let levy = Math.min(1, Math.max(0, settings.levy ?? 0));
  let levyEvery = Math.max(1, Math.round(settings.levyEvery ?? 1));
  let rounds = 0;
  const random = createRandomSource(seed);
  const wealth = start ? Float64Array.from(start) : new Float64Array(n).fill(1 / n);
  const frames: Float64Array[] = [Float64Array.from(wealth)];
  const trades: number[] = [0];
  const turnover: number[] = [0];
  let done = 0;
  let inRound = 0;
  let moved = 0;
  let finished = cap <= 0 || stopped(stop, wealth, 0);

  function endRound(): void {
    rounds++;
    if (levy > 0 && rounds % levyEvery === 0) applyFlatWealthLevy(wealth, levy);
    frames.push(Float64Array.from(wealth));
    trades.push(done);
    turnover.push(moved);
    inRound = 0;
    moved = 0;
    finished = done >= cap || stopped(stop, wealth, done);
  }

  return {
    wealth,
    get trades() {
      return done;
    },
    get done() {
      return finished;
    },
    play(count: number): void {
      for (let k = 0; k < count && !finished; k++) {
        const a = Math.floor(random.next() * n);
        let b = Math.floor(random.next() * (n - 1));
        if (b >= a) b++;
        moved += applyYardSaleTrade(wealth, a, b, beta, random.next() < 0.5);
        done++;
        inRound++;
        // the richest can only change between the two who just traded
        const reached =
          stop.kind === 'share' ? wealth[a] >= stop.share || wealth[b] >= stop.share : stop.kind === 'trades' && done >= stop.trades;
        if (inRound >= n || reached || done >= cap) endRound();
      }
    },
    take(index: number, rate: number): number {
      return applyTargetedWealthLevy(wealth, index, rate);
    },
    setRules(rules): void {
      if (rules.beta !== undefined) beta = Math.min(1, Math.max(0, rules.beta));
      if (rules.levy !== undefined) levy = Math.min(1, Math.max(0, rules.levy));
      if (rules.levyEvery !== undefined) levyEvery = Math.max(1, Math.round(rules.levyEvery));
    },
    recording: (): Recording => ({ seed, settings, frames: frames.slice(), trades: trades.slice(), turnover: turnover.slice() }),
  };
}

export function record(settings: RunSettings, seed: number, start?: ArrayLike<number>): Recording {
  const r = recorder(settings, seed, start);
  while (!r.done) r.play(settings.n * 50);
  return r.recording();
}

/** The richest's index and share in a frame. */
export function richest(frame: ArrayLike<number>): { index: number; share: number } {
  let index = 0;
  let total = 0;
  for (let i = 0; i < frame.length; i++) {
    total += frame[i];
    if (frame[i] > frame[index]) index = i;
  }
  return { index, share: total > 0 ? frame[index] / total : 0 };
}

/**
 * The defaults (owner, 2026-09-26: "stop sooner … a few shapes in between";
 * "0.5 is too large and jittery, maybe .25?"; 2026-09-27: "still jittery",
 * a tenth). Measured over 40 runs at a tenth: the richest first holds 40%
 * after about 278,000 trades (200,000–384,000) — at a quarter it was about
 * 48,000: the same end, reached in smaller, smoother steps.
 */
export const DEFAULT_RUN: RunSettings = {
  n: 100,
  beta: 0.1,
  stop: { kind: 'share', share: 0.4 },
  cap: 1_000_000,
};

/**
 * Play the same room on: more rounds after the last one, with fresh dice
 * (Scene 19, "run it longer"). The earlier rounds stay exactly as they were.
 */
export function extend(recording: Recording, settings: RunSettings, seed: number): Recording {
  const last = recording.frames[recording.frames.length - 1];
  const done = recording.trades[recording.trades.length - 1];
  const more = record(settings, seed, last);
  return {
    seed: recording.seed,
    settings: recording.settings,
    frames: [...recording.frames, ...more.frames.slice(1)],
    trades: [...recording.trades, ...more.trades.slice(1).map((t) => t + done)],
    turnover: [...recording.turnover, ...more.turnover.slice(1)],
  };
}

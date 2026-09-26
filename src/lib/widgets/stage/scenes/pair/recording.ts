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

export function record(settings: RunSettings, seed: number): Recording {
  const { n, beta, stop, cap } = settings;
  const random = createRandomSource(seed);
  const wealth = new Float64Array(n).fill(1 / n);
  const frames: Float64Array[] = [Float64Array.from(wealth)];
  const trades: number[] = [0];
  const turnover: number[] = [0];
  let done = 0;
  while (done < cap && !stopped(stop, wealth, done)) {
    let moved = 0;
    let reached = false;
    for (let k = 0; k < n && done < cap && !reached; k++) {
      const a = Math.floor(random.next() * n);
      let b = Math.floor(random.next() * (n - 1));
      if (b >= a) b++;
      moved += applyYardSaleTrade(wealth, a, b, beta, random.next() < 0.5);
      done++;
      // the richest can only change between the two who just traded
      if (stop.kind === 'share') reached = wealth[a] >= stop.share || wealth[b] >= stop.share;
      else if (stop.kind === 'trades') reached = done >= stop.trades;
    }
    frames.push(Float64Array.from(wealth));
    trades.push(done);
    turnover.push(moved);
  }
  return { seed, settings, frames, trades, turnover };
}

/** The frame showing the room after `trades` trades (the last one at or before it). */
export function frameAt(recording: Recording, trades: number): number {
  const t = recording.trades;
  let lo = 0;
  let hi = t.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (t[mid] <= trades) lo = mid;
    else hi = mid - 1;
  }
  return lo;
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
 * The defaults (owner, 2026-09-26: "stop sooner … a few shapes in between").
 * Measured over 60 runs: when the richest first holds 40%, a dozen or two still
 * hold 10¢ or more, effective participants is about four, the Gini about 0.96.
 */
export const DEFAULT_RUN: RunSettings = {
  n: 100,
  beta: 0.5,
  stop: { kind: 'share', share: 0.4 },
  cap: 100_000,
};

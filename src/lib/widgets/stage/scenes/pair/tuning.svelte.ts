/**
 * Knobs for the owner while the stage is being tuned (owner, 2026-09-26: "a
 * debugging control, just for me … we later remove that"). Visit with
 * `?debug=1` to turn the debug panel on (it stays on in this browser),
 * `?debug=0` to turn it off. The values live in this browser only; everyone
 * else gets the defaults. Delete this file and the panel when tuning is done.
 */
import { DEFAULT_RUN, type RunSettings, type StopRule } from './recording';

const KEY = 'merit-or-math:tuning:v1';

export type StopKind = StopRule['kind'];

export interface Tuning {
  debug: boolean;
  stop: StopKind;
  /** Stop once the richest holds this share (0–1). */
  share: number;
  /** Stop after this many trades. */
  trades: number;
  /** Stop once only this many hold at least `floorCents` each. */
  survivors: number;
  floorCents: number;
  /** The stake: this fraction of the poorer one's money. */
  beta: number;
  /** How long the run plays on screen, ms. */
  runMs: number;
}

export const DEFAULT_TUNING: Tuning = {
  debug: false,
  stop: 'share',
  share: 0.4,
  trades: 20_000,
  survivors: 20,
  floorCents: 10,
  beta: DEFAULT_RUN.beta,
  runMs: 16_000,
};

export const tuning = $state<Tuning>({ ...DEFAULT_TUNING });

/** Read this browser's knobs, and `?debug` from the address. */
export function loadTuning(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Tuning> | null;
    if (saved) Object.assign(tuning, { ...DEFAULT_TUNING, ...saved });
  } catch {
    // no storage: the defaults
  }
  const flag = new URLSearchParams(location.search).get('debug');
  if (flag !== null) {
    tuning.debug = flag !== '0';
    saveTuning();
  }
}

export function saveTuning(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tuning));
  } catch {
    // no storage: the knobs last for this visit
  }
}

export function resetTuning(): void {
  Object.assign(tuning, { ...DEFAULT_TUNING, debug: tuning.debug });
  saveTuning();
}

/** The run the knobs describe; a room of `n` people who each start with 1/n. */
export function runSettings(n = 100, startDollars = 100): RunSettings {
  const floor = tuning.floorCents / 100 / (n * startDollars);
  const stop: StopRule =
    tuning.stop === 'trades'
      ? { kind: 'trades', trades: Math.max(1, Math.round(tuning.trades)) }
      : tuning.stop === 'survivors'
        ? { kind: 'survivors', count: Math.max(1, Math.round(tuning.survivors)), floor }
        : { kind: 'share', share: Math.min(0.999, Math.max(0.02, tuning.share)) };
  return { n, beta: Math.min(1, Math.max(0.01, tuning.beta)), stop, cap: DEFAULT_RUN.cap };
}

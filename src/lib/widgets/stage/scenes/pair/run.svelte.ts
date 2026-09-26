/**
 * The run of Scene 13: the real Yard-Sale rule on the room the reader is
 * already watching (iteration-2 brief; ADR-018 "the two clocks survive inside
 * the stage"). Unseeded, as the reveal always was — every run rolls fresh dice.
 * It plays in time and is never scrubbed: stepping back over it shows how the
 * last run ended, and "Again" rolls a new one.
 *
 * The last run is remembered for the visit (sessionStorage), so a reload or a
 * step back shows the same room; with nothing remembered — a deep link — a run
 * is rolled at once. Every finished run is logged for the chapters after it
 * ("the people you just watched").
 */
import { createEngine, type SimEngine } from '$lib/sim';
import { createTicker } from '../../../shared/ticker';
import { logRun } from '../../../shared/runLog.svelte';

const STORAGE_KEY = 'merit-or-math:pair-run:v1';

export interface RunState {
  /** Bumped whenever the wealth changes; read it to redraw. */
  revision: number;
  running: boolean;
  done: boolean;
  /** Trades so far. */
  trades: number;
  /** Who holds the most right now; -1 before anything happened. */
  winner: number;
  /** Their share of everything, 0–1. */
  share: number;
  /** How many runs have finished this visit. */
  finished: number;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);

export function createRun(n: number, beta: number, trades: number, durationMs: number) {
  const state = $state<RunState>({ revision: 0, running: false, done: false, trades: 0, winner: -1, share: 0, finished: 0 });
  let engine: SimEngine | null = null;
  /** Everyone's share of the room; equal before the first run. */
  let wealth = new Float64Array(n).fill(1 / n);
  let elapsed = 0;
  let onDone: (() => void) | null = null;

  function measure(): void {
    let max = -1;
    let argmax = -1;
    let total = 0;
    for (let i = 0; i < n; i++) {
      total += wealth[i];
      if (wealth[i] > max) {
        max = wealth[i];
        argmax = i;
      }
    }
    state.winner = argmax;
    state.share = total > 0 ? max / total : 0;
    state.revision++;
  }

  const ticker = createTicker((dt) => {
    if (!engine) return;
    elapsed += dt;
    const progress = Math.min(1, elapsed / durationMs);
    const target = Math.round(easeInOutCubic(progress) * trades);
    const by = target - engine.state.step;
    if (by > 0) engine.step(by);
    wealth = Float64Array.from(engine.state.wealth);
    state.trades = engine.state.step;
    measure();
    if (progress >= 1) finish();
  });

  function remember(seed: number): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ seed, trades: state.trades, wealth: [...wealth] }));
    } catch {
      // private mode: the room is rolled again next time
    }
  }

  /** Stop wherever the run is and finish it at once — the reader asked to move on. */
  function finish(): void {
    if (!engine || state.done) return;
    ticker.stop();
    const left = trades - engine.state.step;
    if (left > 0) engine.step(left);
    wealth = Float64Array.from(engine.state.wealth);
    state.trades = engine.state.step;
    state.running = false;
    state.done = true;
    measure();
    state.finished++;
    const seed = engine.config.seed ?? -1;
    logRun({ seed, beta, trades: state.trades, wealth: Float64Array.from(wealth), winner: state.winner, topShare: state.share });
    remember(seed);
    onDone?.();
  }

  return {
    state,
    /** Everyone's share right now (not reactive: read `state.revision`). */
    wealth: () => wealth,
    /** Roll a new room and play it over `durationMs`. */
    start(done?: () => void): void {
      ticker.stop();
      onDone = done ?? null;
      engine = createEngine({ n, beta, seed: freshSeed() });
      wealth = Float64Array.from(engine.state.wealth);
      elapsed = 0;
      state.trades = 0;
      state.done = false;
      state.running = true;
      measure();
      ticker.start();
    },
    finish,
    /** Show how the last run ended, rolling one at once if there is none. */
    ended(): void {
      ticker.stop();
      if (state.done) return;
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
        if (saved && Array.isArray(saved.wealth) && saved.wealth.length === n) {
          wealth = Float64Array.from(saved.wealth as number[]);
          state.trades = Number(saved.trades) || trades;
          state.running = false;
          state.done = true;
          measure();
          return;
        }
      } catch {
        // a broken entry: roll a new room below
      }
      onDone = null;
      engine = createEngine({ n, beta, seed: freshSeed() });
      state.done = false;
      finish();
    },
    /** Before any run: everyone equal. */
    clear(): void {
      ticker.stop();
      if (state.running) {
        state.running = false;
      }
      wealth = new Float64Array(n).fill(1 / n);
      state.trades = 0;
      state.done = false;
      measure();
      state.winner = -1;
    },
    stop(): void {
      ticker.stop();
    },
  };
}

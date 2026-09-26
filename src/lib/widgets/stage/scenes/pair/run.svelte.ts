/**
 * The run of Scene 13, on the room the reader is already watching
 * (iteration-2 brief; ADR-018 "the two clocks survive inside the stage").
 * Unseeded, as the reveal always was — every run rolls fresh dice.
 *
 * A run is RECORDED first (recording.ts: every round kept, and the money that
 * changed hands in it) and then played back in time. So finishing early is a
 * jump to the end, the time dial rewinds to any round of the same run, and
 * every measure on screen reads whatever moment is showing (owner review
 * 2026-09-26: "replay the exact same thing … a few steps ago").
 *
 * The last run is remembered for the visit as its seed and settings — a few
 * numbers — and rebuilt identically on reload or on a step back. With nothing
 * remembered, a deep link rolls a run at once. Every finished run is logged for
 * the chapters after the stage.
 */
import { createTicker } from '../../../shared/ticker';
import { logRun } from '../../../shared/runLog.svelte';
import { record, richest, type Recording, type RunSettings } from './recording';

const STORAGE_KEY = 'merit-or-math:pair-run:v2';

export interface RunState {
  /** Bumped whenever what is on screen changes; read it to redraw. */
  revision: number;
  running: boolean;
  done: boolean;
  /** Trades by the moment on screen. */
  trades: number;
  /** Who holds the most at that moment; -1 before anything happened. */
  winner: number;
  /** Their share of everything, 0–1. */
  share: number;
  /** How many runs have finished this visit. */
  finished: number;
  /** The frame on screen, and how many frames the run has. */
  frame: number;
  frames: number;
  /** A finished run being played again from the time player. */
  playing: boolean;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);

export function createRun(settings: () => RunSettings, durationMs: () => number) {
  const n = settings().n;
  const state = $state<RunState>({
    revision: 0,
    running: false,
    done: false,
    trades: 0,
    winner: -1,
    share: 0,
    finished: 0,
    frame: 0,
    frames: 0,
    playing: false,
  });
  let recording: Recording | null = null;
  let equal = new Float64Array(n).fill(1 / n);
  let elapsed = 0;
  let onDone: (() => void) | null = null;

  function show(frame: number): void {
    if (!recording) return;
    state.frame = Math.max(0, Math.min(recording.frames.length - 1, frame));
    state.trades = recording.trades[state.frame];
    const top = richest(recording.frames[state.frame]);
    state.winner = top.index;
    state.share = top.share;
    state.revision++;
  }

  const ticker = createTicker((dt) => {
    if (!recording) return;
    elapsed += dt;
    const progress = Math.min(1, elapsed / Math.max(500, durationMs()));
    show(Math.round(easeInOutCubic(progress) * (recording.frames.length - 1)));
    if (progress >= 1) finish();
  });

  /** Playing a finished run again, from the time player: the whole run in about eight seconds. */
  let replayAt = 0;
  const replayer = createTicker((dt) => {
    if (!recording) return;
    const perFrame = 8000 / Math.max(1, recording.frames.length - 1);
    replayAt += dt / perFrame;
    show(Math.min(recording.frames.length - 1, Math.floor(replayAt)));
    if (state.frame >= recording.frames.length - 1) {
      replayer.stop();
      state.playing = false;
    }
  });

  function remember(): void {
    if (!recording) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ seed: recording.seed, settings: recording.settings }));
    } catch {
      // private mode: the room is rolled again next time
    }
  }

  function adopt(next: Recording): void {
    recording = next;
    state.frames = next.frames.length;
  }

  /** Stop wherever the playback is and show how the run ends — the reader asked to move on. */
  function finish(): void {
    if (!recording || state.done) return;
    ticker.stop();
    show(recording.frames.length - 1);
    state.running = false;
    state.done = true;
    state.finished++;
    const last = recording.frames[recording.frames.length - 1];
    logRun({
      seed: recording.seed,
      beta: recording.settings.beta,
      trades: state.trades,
      wealth: Float64Array.from(last),
      winner: state.winner,
      topShare: state.share,
    });
    remember();
    onDone?.();
  }

  return {
    state,
    /** Everyone's share at the moment on screen (not reactive: read `state.revision`). */
    wealth: (): Float64Array => (recording && (state.running || state.done) ? (recording.frames[state.frame] as Float64Array) : equal),
    /** The recording itself, for turnover and the time dial. */
    recording: (): Recording | null => recording,
    /** Roll a new room, record it, and play it back. */
    start(done?: () => void): void {
      ticker.stop();
      onDone = done ?? null;
      adopt(record(settings(), freshSeed()));
      elapsed = 0;
      state.done = false;
      state.running = true;
      show(0);
      ticker.start();
    },
    finish,
    /** Show how the last run ended — rebuilt from its seed if need be, rolled at once if there is none. */
    ended(): void {
      ticker.stop();
      if (state.done && recording) return;
      let rebuilt: Recording | null = null;
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
        if (saved && Number.isFinite(saved.seed) && saved.settings) rebuilt = record(saved.settings as RunSettings, saved.seed);
      } catch {
        // a broken entry: roll a new room below
      }
      onDone = null;
      adopt(rebuilt ?? record(settings(), freshSeed()));
      state.done = false;
      state.running = false;
      if (rebuilt) {
        show(rebuilt.frames.length - 1);
        state.done = true;
      } else {
        state.running = true;
        finish();
      }
    },
    /** The time player: show the run as it stood at frame `frame`. */
    scrub(frame: number): void {
      if (!recording || state.running) return;
      replayer.stop();
      state.playing = false;
      show(frame);
    },
    /** Play the finished run again from where the player stands (from the start, if at the end). */
    play(): void {
      if (!recording || state.running) return;
      if (state.frame >= recording.frames.length - 1) show(0);
      replayAt = state.frame;
      state.playing = true;
      replayer.start();
    },
    pause(): void {
      replayer.stop();
      state.playing = false;
    },
    /** Before any run: everyone equal. */
    clear(): void {
      ticker.stop();
      replayer.stop();
      state.playing = false;
      state.running = false;
      state.done = false;
      state.trades = 0;
      state.winner = -1;
      state.share = 0;
      equal = new Float64Array(n).fill(1 / n);
      state.revision++;
    },
    stop(): void {
      ticker.stop();
      replayer.stop();
      state.playing = false;
    },
  };
}

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
 *
 * The reader's own rooms after it (Scenes 20–23) are runs too, each its own
 * instance: the dial's fresh rooms, the matched pair played on one seed, and
 * the tax game, which is played LIVE — recorded as it goes, a few trades a
 * frame, with the reader's taps in it — and rewinds like any other run after.
 */
import { createTicker } from '../../../shared/ticker';
import { logRun } from '../../../shared/runLog.svelte';
import { extend, record, recorder, richest, type Recorder, type Recording, type RunSettings } from './recording';

const STORAGE_KEY = 'merit-or-math:pair-run:v2';

export interface RunOptions {
  /** Remember the last run for the visit under this key; the main run only. */
  readonly remember?: boolean;
  /** Log finished runs for the chapters after the stage; the main run only. */
  readonly log?: boolean;
}

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

export function createRun(settings: () => RunSettings, durationMs: () => number, options: RunOptions = { remember: true, log: true }) {
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
  /** Where the playback starts: 0, or the old end when a run is played on. */
  let from = 0;
  /** The live room (Scene 21), while it trades. */
  let live: Recorder | null = null;

  function show(frame: number): void {
    if (!recording) return;
    state.frame = Math.max(0, Math.min(recording.frames.length - 1, frame));
    state.trades = recording.trades[state.frame];
    const top = richest(recording.frames[state.frame]);
    state.winner = top.index;
    state.share = top.share;
    state.revision++;
  }

  /** How long this playback takes, when not the usual. */
  let playMs: number | null = null;

  const ticker = createTicker((dt) => {
    if (!recording) return;
    elapsed += dt;
    const progress = Math.min(1, elapsed / Math.max(500, playMs ?? durationMs()));
    show(from + Math.round(easeInOutCubic(progress) * (recording.frames.length - 1 - from)));
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
    if (!recording || !options.remember) return;
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
    // a run played on is the same run, not a new one
    if (from === 0) {
      state.finished++;
      if (options.log)
        logRun({
          seed: recording.seed,
          beta: recording.settings.beta,
          trades: state.trades,
          wealth: Float64Array.from(recording.frames[recording.frames.length - 1]),
          winner: state.winner,
          topShare: state.share,
        });
    }
    remember();
    onDone?.();
  }

  /** The live room, shown as it stands this instant. */
  function showLive(): void {
    if (!live) return;
    state.trades = live.trades;
    const top = richest(live.wealth);
    state.winner = top.index;
    state.share = top.share;
    state.revision++;
  }

  /** Trades owed to the live room: a fraction of a trade carries into the next frame. */
  let owed = 0;
  let livePerSecond = 0;
  let liveTick: ((dt: number) => void) | null = null;
  const liveTicker = createTicker((dt) => {
    if (!live) return;
    owed += (dt * livePerSecond) / 1000;
    const count = Math.floor(owed);
    owed -= count;
    const rounds = state.frames;
    live.play(count);
    const kept = live.trades > 0 ? live.recording() : null;
    if (kept && kept.frames.length !== rounds) adopt(kept);
    showLive();
    liveTick?.(dt);
    if (live?.done) endLive();
  });

  /** The live room stops trading and becomes an ordinary recording: rewind it, play it again. */
  function endLive(): void {
    if (!live) return;
    liveTicker.stop();
    adopt(live.recording());
    live = null;
    liveTick = null;
    state.running = false;
    state.done = true;
    show(recording!.frames.length - 1);
  }

  function stopAll(): void {
    ticker.stop();
    replayer.stop();
    liveTicker.stop();
    live = null;
    liveTick = null;
    state.playing = false;
  }

  return {
    state,
    /**
     * Everyone's share at the moment on screen. Reading it subscribes to
     * `state.revision`: the recording itself is not reactive, so a reader
     * that saw an empty room must still hear when a run starts.
     */
    wealth: (): Float64Array => {
      void state.revision;
      return live ? live.wealth : recording && (state.running || state.done) ? (recording.frames[state.frame] as Float64Array) : equal;
    },
    /** The recording itself, for turnover and the time dial. */
    recording: (): Recording | null => recording,
    /** Roll a new room (on `seed`, if given: the matched pair shares one), record it, and play it back. */
    start(done?: () => void, seed = freshSeed(), ms: number | null = null): void {
      stopAll();
      onDone = done ?? null;
      adopt(record(settings(), seed));
      elapsed = 0;
      from = 0;
      playMs = ms;
      state.done = false;
      state.running = true;
      show(0);
      ticker.start();
    },
    /**
     * Play the same room on from where it ended, with fresh dice, until `more`
     * says stop (Scene 19, "run it longer"); the earlier rounds stay as they were.
     */
    longer(more: RunSettings, ms: number, done?: () => void): void {
      if (!recording || state.running || live) return;
      stopAll();
      onDone = done ?? null;
      from = recording.frames.length - 1;
      adopt(extend(recording, more, freshSeed()));
      elapsed = 0;
      playMs = ms;
      state.done = false;
      state.running = true;
      show(from);
      ticker.start();
    },
    /**
     * A fresh room, equal, trading live at `perSecond` trades a second until
     * the settings' stop rule (Scene 21); `tick` runs every frame after the trades.
     */
    live(perSecond: number, tick: (dt: number) => void, seed = freshSeed()): void {
      stopAll();
      onDone = null;
      live = recorder(settings(), seed);
      adopt(live.recording());
      owed = 0;
      livePerSecond = perSecond;
      liveTick = tick;
      from = 0;
      state.done = false;
      state.running = true;
      state.frame = 0;
      showLive();
      liveTicker.start();
    },
    /** The reader's tap in the live room: `rate` of one fortune, shared back equally. Returns what was taken. */
    take(index: number, rate: number): number {
      if (!live) return 0;
      const taken = live.take(index, rate);
      showLive();
      return taken;
    },
    /** Whether the room is trading live right now. */
    isLive: (): boolean => live !== null,
    endLive,
    finish,
    /** Show how the last run ended — rebuilt from its seed if need be, rolled at once if there is none. */
    ended(): void {
      if (live) return;
      // still playing: the reader asked to move on, so show how this one ends
      if (state.running && recording) {
        finish();
        return;
      }
      ticker.stop();
      if (state.done && recording) return;
      let rebuilt: Recording | null = null;
      try {
        const saved = options.remember ? JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') : null;
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
      if (!recording || state.running || live) return;
      replayer.stop();
      state.playing = false;
      show(frame);
    },
    /** Play the finished run again from where the player stands (from the start, if at the end). */
    play(): void {
      if (!recording || state.running || live) return;
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
      stopAll();
      recording = null;
      state.frames = 0;
      state.frame = 0;
      state.running = false;
      state.done = false;
      state.trades = 0;
      state.winner = -1;
      state.share = 0;
      equal = new Float64Array(n).fill(1 / n);
      state.revision++;
    },
    stop: stopAll,
  };
}

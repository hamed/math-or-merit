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
  /** Trades a second when the player plays on past the end (owner review 2026-09-26: "it will continue run"). */
  readonly pace?: number;
}

/** A run, and more rounds played on after it, as one recording. */
function joined(first: Recording, more: Recording): Recording {
  const done = first.trades[first.trades.length - 1];
  return {
    seed: first.seed,
    settings: first.settings,
    frames: [...first.frames, ...more.frames.slice(1)],
    trades: [...first.trades, ...more.trades.slice(1).map((t) => t + done)],
    turnover: [...first.turnover, ...more.turnover.slice(1)],
  };
}

/** A run played on stops somewhere: two million trades is hours of watching. */
const PLAY_ON_CAP = 2_000_000;

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
  /**
   * Bumped whenever the moment on screen jumps rather than plays: the reader
   * scrubs, or a run is cut short to its end. What follows the frames (the
   * faces) rebuilds the moment it lands on instead of feeling the jump.
   */
  seeks: number;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);

export function createRun(settings: () => RunSettings, durationMs: () => number, options: RunOptions = { remember: true, log: true }) {
  const settingsNow = settings;
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
    seeks: 0,
  });
  let recording: Recording | null = null;
  let equal = new Float64Array(n).fill(1 / n);
  let elapsed = 0;
  let onDone: (() => void) | null = null;
  /** Where the playback starts: 0, or the old end when a run is played on. */
  let from = 0;
  /** The live room (Scene 21), while it trades. */
  let live: Recorder | null = null;
  /** Playing on past the end: what was recorded before the live rounds. */
  let before: Recording | null = null;

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

  /** Moving through the run to another moment (`travel`): from where, to where, how long, how far along. */
  let trip = { from: 0, to: 0, ms: 0, at: 0 };
  const traveller = createTicker((dt) => {
    if (!recording) return;
    trip.at += dt;
    const p = Math.min(1, trip.at / Math.max(1, trip.ms));
    show(Math.round(trip.from + (trip.to - trip.from) * easeInOutCubic(p)));
    if (p >= 1) traveller.stop();
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
    // played to its end, it ends where it stands; cut short, it jumps there
    if (state.frame !== recording.frames.length - 1) state.seeks++;
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
    state.trades = live.trades + (before ? before.trades[before.trades.length - 1] : 0);
    const top = richest(live.wealth);
    state.winner = top.index;
    state.share = top.share;
    state.revision++;
  }

  /** Trades owed to the live room: a fraction of a trade carries into the next frame. */
  let owed = 0;
  let livePerSecond = 0;
  /** Trades a second for playing on; the sandbox's speed dial sets it. */
  let pace = options.pace ?? 1_000;
  let liveTick: ((dt: number) => void) | null = null;
  const liveTicker = createTicker((dt) => {
    if (!live) return;
    owed += (dt * livePerSecond) / 1000;
    const count = Math.floor(owed);
    owed -= count;
    const rounds = state.frames;
    live.play(count);
    const kept = live.trades > 0 ? live.recording() : null;
    if (kept && (before ? before.frames.length + kept.frames.length - 1 : kept.frames.length) !== rounds) {
      adopt(before ? joined(before, kept) : kept);
      state.frame = state.frames - 1;
    }
    showLive();
    liveTick?.(dt);
    if (live?.done) endLive();
  });

  /** The live room stops trading and becomes an ordinary recording: rewind it, play it again. */
  function endLive(): void {
    if (!live) return;
    liveTicker.stop();
    adopt(before ? joined(before, live.recording()) : live.recording());
    live = null;
    before = null;
    liveTick = null;
    state.running = false;
    state.playing = false;
    state.done = true;
    show(recording!.frames.length - 1);
    remember();
  }

  /** Play on from the last round, trading live with fresh dice, until paused. */
  function playOn(): void {
    if (!recording) return;
    const last = recording.trades[recording.trades.length - 1];
    if (last >= PLAY_ON_CAP) return;
    before = recording;
    // the rules as the dials stand now: the room plays on by whatever the reader has turned
    const settings: RunSettings = { ...settingsNow(), stop: { kind: 'trades', trades: PLAY_ON_CAP - last }, cap: PLAY_ON_CAP - last };
    live = recorder(settings, freshSeed(), recording.frames[recording.frames.length - 1]);
    owed = 0;
    livePerSecond = pace;
    liveTick = null;
    state.playing = true;
    liveTicker.start();
  }

  function stopAll(): void {
    ticker.stop();
    replayer.stop();
    traveller.stop();
    liveTicker.stop();
    live = null;
    before = null;
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
    live(perSecond: number, tick: (dt: number) => void, seed = freshSeed(), start?: ArrayLike<number>): void {
      stopAll();
      onDone = null;
      live = recorder(settings(), seed, start);
      adopt(live.recording());
      owed = 0;
      livePerSecond = perSecond;
      liveTick = tick;
      from = 0;
      state.done = false;
      state.running = true;
      state.playing = true;
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
    /**
     * The finished room moves through its own run to `frame` over `ms`, as a
     * film rewound or wound on (owner, 2026-10-10: "red goes back in time …
     * and show where we started"): every frame between is shown, so faces
     * feel the way back as they felt the way there.
     */
    travel(frame: number, ms: number): void {
      if (!recording || state.running || live) return;
      replayer.stop();
      traveller.stop();
      state.playing = false;
      const to = Math.max(0, Math.min(recording.frames.length - 1, Math.round(frame)));
      if (ms <= 0 || to === state.frame) {
        if (to !== state.frame) state.seeks++;
        show(to);
        return;
      }
      trip = { from: state.frame, to, ms, at: 0 };
      traveller.start();
    },
    scrub(frame: number): void {
      if (before) endLive();
      if (!recording || state.running || live) return;
      traveller.stop();
      replayer.stop();
      state.playing = false;
      state.seeks++;
      show(frame);
    },
    /**
     * Play the finished run again from where the player stands — or, at its
     * end, play on: the same room keeps trading, live, until paused.
     */
    play(): void {
      if (!recording || state.running || live) return;
      if (state.frame >= recording.frames.length - 1) {
        playOn();
        return;
      }
      replayAt = state.frame;
      state.playing = true;
      replayer.start();
    },
    pause(): void {
      replayer.stop();
      if (live) endLive();
      state.playing = false;
    },
    /** A dial turned while the room trades live: the next trade plays by it. */
    setRules(rules: { beta?: number; levy?: number; levyEvery?: number }): void {
      live?.setRules(rules);
    },
    /** Trades a second, live and for playing on. */
    setPace(perSecond: number): void {
      pace = perSecond;
      if (live) livePerSecond = perSecond;
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

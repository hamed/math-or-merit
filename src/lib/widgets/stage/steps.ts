/**
 * The step stage's contract and its state machine (ADR-017).
 *
 * A stage is a list of steps, as data. The player that drives it never names a
 * scene and never branches on one (ADR-005, ADR-013's guard): what a step LOOKS
 * like lives in the scene; what a step IS lives here. This file is headless —
 * no DOM, no Svelte, no GSAP — so every rule about moving through a stage is a
 * unit test rather than a screenshot.
 */

export type Speaker = 'blue' | 'red';

/** How a step lets go. */
export type Wait =
  /** The default: the reader's next input advances. */
  | { readonly kind: 'reader' }
  /** Advances by itself (the teletype, the reels, the crowd). */
  | { readonly kind: 'auto'; readonly ms: number }
  /**
   * Chit-chat (iteration 2, 3.2): banter, reactions, bragging. Advances by
   * itself once read — the scene says how long its words take — pauses while
   * the pointer rests on it, and never blocks a reader who wants to go on.
   */
  | { readonly kind: 'chat' }
  /** Holds until the scene reports the reader has done the thing (8 and 8). */
  | { readonly kind: 'action' };

export interface LineSpec {
  readonly who: Speaker | null;
  /** A message key from messages/{locale}.json — never literal words (A2). */
  readonly message: string;
}

export interface StepSpec {
  /** Unique within the stage. Also what a hold is released by. */
  readonly id: string;
  readonly lines?: readonly LineSpec[];
  readonly wait: Wait;
}

export const READER: Wait = { kind: 'reader' };
export const HOLD: Wait = { kind: 'action' };
export const CHAT: Wait = { kind: 'chat' };
export const auto = (ms: number): Wait => ({ kind: 'auto', ms });

/**
 * How long chit-chat stays before moving on, ms: the script's
 * `max(minread, words × perword)`, in seconds (decl.tex; GRAMMAR.md §6). A
 * stage passes its script's numbers; the defaults are decl.tex's own — a
 * second and a half at least, 150 words a minute, a pace for readers of a
 * second language (brief 3.2).
 */
export function readingMs(words: number, perword = 0.4, minread = 1.5): number {
  return Math.round(1000 * Math.max(minread, Math.max(0, words) * perword));
}

/** Sanity-checkable at data level, like `validateBeats`. */
export function validateSteps(steps: readonly StepSpec[]): string[] {
  const problems: string[] = [];
  if (steps.length === 0) problems.push('a stage needs at least one step');
  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.id)) problems.push(`duplicate step id "${step.id}"`);
    seen.add(step.id);
    if (step.wait.kind === 'auto' && !(step.wait.ms > 0)) {
      problems.push(`step "${step.id}" waits a non-positive time`);
    }
  }
  return problems;
}

/**
 * What an input did.
 *
 * `moved`  — the stage is on a new step.
 * `held`   — forward was asked for at a hold the reader has not released yet.
 * `end`    — forward past the last step: the gesture belongs to the page.
 * `start`  — back before the first step: the gesture belongs to the page.
 * `hurried` — the scene was still arriving (a bubble's lines coming in one by
 *             one); forward finished that instead of moving on.
 */
export type StepResult = 'moved' | 'held' | 'end' | 'start' | 'hurried';

export interface StepSnapshot {
  readonly index: number;
  readonly released: readonly string[];
}

export class StepMachine {
  readonly steps: readonly StepSpec[];
  private current = 0;
  /** Holds, once released, stay released: stepping back never asks again. */
  private readonly released = new Set<string>();

  constructor(steps: readonly StepSpec[]) {
    const problems = validateSteps(steps);
    if (problems.length > 0) throw new RangeError(problems.join('; '));
    this.steps = steps;
  }

  get index(): number {
    return this.current;
  }

  get step(): StepSpec {
    return this.steps[this.current];
  }

  get atFirst(): boolean {
    return this.current === 0;
  }

  get atLast(): boolean {
    return this.current === this.steps.length - 1;
  }

  /** Whether the reader is being waited on right now. */
  get holding(): boolean {
    return this.step.wait.kind === 'action' && !this.released.has(this.step.id);
  }

  isReleased(id: string): boolean {
    return this.released.has(id);
  }

  next(): StepResult {
    if (this.holding) return 'held';
    if (this.atLast) return 'end';
    this.current++;
    return 'moved';
  }

  back(): StepResult {
    if (this.atFirst) return 'start';
    this.current--;
    return 'moved';
  }

  /**
   * The scene reports a hold is done. Releasing the CURRENT step also moves on:
   * the reader just did what was asked, and making them ask again is friction.
   * Returns what happened to the position.
   */
  release(id: string): StepResult | 'noted' {
    if (!this.steps.some((step) => step.id === id)) return 'noted';
    const wasCurrent = this.step.id === id && this.holding;
    this.released.add(id);
    return wasCurrent ? this.next() : 'noted';
  }

  /** Jump — for restore, and for arriving at a stage from below. */
  seek(index: number): void {
    this.current = Math.max(0, Math.min(this.steps.length - 1, Math.trunc(index)));
  }

  /** Jump toward a step, but never past a hold the reader has not done (like `restore`). */
  /** Count every hold before `index` as done: a jump the reader asked for explicitly. */
  releaseBefore(index: number): void {
    for (let i = 0; i < Math.min(index, this.steps.length); i++) if (this.steps[i].wait.kind === 'action') this.released.add(this.steps[i].id);
  }

  reach(index: number): void {
    this.restore({ index, released: [...this.released] });
  }

  snapshot(): StepSnapshot {
    return { index: this.current, released: [...this.released] };
  }

  /**
   * Restore a snapshot, trusting none of it: an unknown hold id is dropped and
   * an index is clamped, because a stale session entry from an older build
   * must never strand a reader mid-stage.
   */
  restore(snapshot: unknown): boolean {
    if (typeof snapshot !== 'object' || snapshot === null) return false;
    const { index, released } = snapshot as Partial<StepSnapshot>;
    if (typeof index !== 'number' || !Number.isFinite(index)) return false;
    const ids = new Set(this.steps.map((step) => step.id));
    if (Array.isArray(released)) {
      for (const id of released) if (typeof id === 'string' && ids.has(id)) this.released.add(id);
    }
    // Never restore onto a step beyond an unreleased hold: that would skip the
    // thing the stage exists to make the reader do.
    let target = Math.max(0, Math.min(this.steps.length - 1, Math.trunc(index)));
    for (let i = 0; i < target; i++) {
      const step = this.steps[i];
      if (step.wait.kind === 'action' && !this.released.has(step.id)) {
        target = i;
        break;
      }
    }
    this.current = target;
    return true;
  }
}

/** How close the stage's top must be to count as filling the viewport, px. */
export const ENGAGED_PX = 2;
/** How much of a viewport away the stage still answers a gesture aimed at it. */
export const ARRIVE_FRACTION = 0.5;
/**
 * How far the page can slide under a reader who is in the stage and still be
 * put back as a slip. A trackpad's sub-pixel tail slides it a few pixels; a
 * stage leaving on purpose (a choice that scrolls on) passes this in a frame.
 */
export const SLIP_FRACTION = 0.08;

/**
 * Who owns a reading gesture (wheel, key, tap), and what it does.
 *
 * `step`    — the stage fills the viewport: move one step.
 * `swallow` — the tail of a gesture that already acted: eat it, do nothing.
 * `align`   — the reader is inside the stage but the page slipped a few pixels
 *             (a trackpad's tiny tail, a scrollbar nudge): put it back, as is.
 * `arrive`  — the reader is coming to the stage from outside: bring it in.
 * `pass`    — the page's gesture: past either end, or nowhere near the stage.
 *
 * `align` and `arrive` look alike on screen and differ in one thing that
 * matters: arriving from below shows the stage's END, so a stage that had only
 * slid treated as an arrival jumped the whole dialogue to its last line.
 */
export type Claim = 'step' | 'swallow' | 'align' | 'arrive' | 'pass';

export interface Whereabouts {
  /** The stage's top edge against the viewport's, px: positive when it is below. */
  readonly top: number;
  readonly viewport: number;
  /** Stepped, arrived or aligned since the reader last left past an end or scrolled far away. */
  readonly inside: boolean;
  /** A gesture that already acted is still running (its inertial tail). */
  readonly busy: boolean;
}

export function claim(
  where: Whereabouts,
  direction: 1 | -1,
  stage: { readonly atFirst: boolean; readonly atLast: boolean; readonly holding: boolean },
): Claim {
  const leaving = direction > 0 ? stage.atLast && !stage.holding : stage.atFirst;
  if (Math.abs(where.top) <= ENGAGED_PX) {
    if (where.busy) return 'swallow';
    return leaving ? 'pass' : 'step';
  }
  if (Math.abs(where.top) >= where.viewport * ARRIVE_FRACTION) return 'pass';
  if (where.busy) return 'swallow';
  if (where.inside && Math.abs(where.top) <= where.viewport * SLIP_FRACTION) return 'align';
  const toward = (where.top > 0 && direction > 0) || (where.top < 0 && direction < 0);
  return toward ? 'arrive' : 'pass';
}

/**
 * What a scene implements. The player decides WHEN; the scene decides WHAT.
 *
 * `play` animates into a step from the one before it, in time. `settle` jumps
 * to a step's authored end state with no motion, and must be idempotent — it
 * is what stepping back, reduced motion, restore and arriving from below all
 * use, so it is the scene's real definition of each step.
 */
export interface StepScene {
  play(index: number, from: number): void;
  settle(index: number): void;
  /** Forward was asked for at a hold: show the reader what is being waited on. */
  nudge?(index: number): void;
  /**
   * Forward was asked for while the step is still arriving. Finish arriving and
   * return true to keep the reader on this step; false to move on.
   */
  hurry?(index: number): boolean;
  /** How long a `chat` step's words take to read, ms (see `readingMs`). */
  readingMs?(index: number): number;
}

export interface StepStageContext {
  attach(steps: readonly StepSpec[], scene: StepScene): void;
  /** The scene reports a hold is done (both clicked, 8 and 8). */
  release(id: string): void;
  /** Whether a hold has already been done — `settle` on a hold still waiting shows the reader's own progress. */
  isReleased(id: string): boolean;
  /** The reader is resting on something (a bubble): chit-chat waits for them. */
  pause(on: boolean): void;
  /** Forward, as if the reader had asked: a "Not now" link inside a bubble. */
  advance(): void;
  /** Play a step again, from the step before it: "Again" — a new run, in the same room. */
  replay(id: string): void;
  /** Reactive: the step on screen. */
  readonly index: number;
  /** Reactive: the reader asked for no motion. */
  readonly reduced: boolean;
}

export const STEP_STAGE_CONTEXT = 'merit-or-math.step-stage';

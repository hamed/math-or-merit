/**
 * The stage contract (ADR-013): PinScene is a generic scroll-scrubbed
 * sequencer; a scene is a deep module that attaches one deterministic
 * timeline described by a data table of beats. PinScene knows no scene by
 * name — beat→state mapping lives in each scene's own BEATS data, never in
 * the sequencer (the ADR-005 "no `if (beat === 'cow')`" guard).
 */
import type { StageTimeline } from './gsap';

export interface BeatSpec {
  /** Timeline label the scene's tweens anchor to (unique within the scene). */
  readonly label: string;
  /** Relative scroll length of the beat; 1 ≈ one viewport-height of scroll. */
  readonly length: number;
  /**
   * How far down its own box this beat's art reaches, as a fraction. The
   * caption is placed one line under that, so a scene whose picture changes
   * size between beats — a full-frame plate, then a small circle, then a wide
   * ring — says so here instead of leaving a band of empty paper. Falls back to
   * the scene's CSS --art-bottom, then to 1.
   */
  readonly artBottom?: number;
}

export interface StageContext {
  /**
   * Called once by the scene child at mount: its beat table plus a builder
   * that fills the master timeline. Labels for every beat are already on the
   * timeline when `build` runs, so tweens anchor with `position: label`.
   */
  attach(beats: readonly BeatSpec[], build: (tl: StageTimeline) => void): void;
  /** Called by Caption children; returns an unregister function. */
  registerCaption(el: HTMLElement, beat: number): () => void;
}

export const STAGE_CONTEXT = 'merit-or-math.stage';

/** Sanity-checkable at data level (see stage/beats.test.ts). */
export function validateBeats(beats: readonly BeatSpec[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    if (beat.length <= 0) problems.push(`beat "${beat.label}" has non-positive length`);
    if (seen.has(beat.label)) problems.push(`duplicate beat label "${beat.label}"`);
    seen.add(beat.label);
  }
  return problems;
}

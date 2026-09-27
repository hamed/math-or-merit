/**
 * Life (brief 4.4): the protagonists always breathe a little.
 *
 * The breath is AMBIENT — its own clock, never a step's tween — and it is
 * applied to an INNER group while steps move the OUTER one. One element is
 * never driven by two clocks; MEMORY.md records what that cost the first time.
 * Pure functions here; the loop lives in whoever owns the elements.
 */

export interface Breath {
  /** px */
  readonly dx: number;
  readonly dy: number;
  /** multiplier on the radius */
  readonly scale: number;
}

const STILL: Breath = { dx: 0, dy: 0, scale: 1 };

/**
 * A slow, uneven swell and sway, different for each `seed` so two characters
 * never breathe in unison. Bounded: |dx| ≤ 1, |dy| ≤ 1.6, scale within 2%.
 */
export function breath(seconds: number, seed: number, amount = 1): Breath {
  if (!Number.isFinite(seconds) || amount <= 0) return STILL;
  const phase = seed * 2.399963; // golden angle: seeds spread without clustering
  const swell = Math.sin((seconds / 3.4) * 2 * Math.PI + phase);
  const bob = Math.sin((seconds / 2.7) * 2 * Math.PI + phase * 1.7);
  const sway = Math.sin((seconds / 4.1) * 2 * Math.PI + phase * 0.6);
  return {
    dx: sway * 1 * amount,
    dy: bob * 1.6 * amount,
    scale: 1 + swell * 0.02 * amount,
  };
}

/**
 * One rAF loop for everything ambient on a stage. Paused while the tab is
 * hidden; never started at all when the reader asked for no motion.
 */
export function ambientClock(tick: (seconds: number) => void, reduced: boolean): () => void {
  if (reduced || typeof requestAnimationFrame === 'undefined') return () => {};
  let frame = 0;
  const started = performance.now();
  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    if (document.hidden) return;
    tick((now - started) / 1000);
  };
  frame = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(frame);
}

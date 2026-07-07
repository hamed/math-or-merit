/** Shared reduced-motion check for the stage layer and yield widgets. */
export function motionOk(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

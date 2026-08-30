export type GuidedRunState = 'idle' | 'running' | 'finished';
export type GuidedRunAction = 'start' | 'finish' | 'undo' | 'pass';

/** One gesture performs at most one authored action; finished runs release forward travel. */
export function guidedRunAction(state: GuidedRunState, direction: -1 | 1): GuidedRunAction {
  if (direction < 0) return state === 'idle' ? 'pass' : 'undo';
  if (state === 'idle') return 'start';
  if (state === 'running') return 'finish';
  return 'pass';
}
